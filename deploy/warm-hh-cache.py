#!/usr/bin/env python3
"""Warm the portal's Hamburg-upstream cache (deploy/nginx.conf /hh-api/ + /geodienste/).

Replays the exact requests the COSI app makes for the presentation-critical
datasets, so nginx has a copy to serve STALE when api.hamburg.de /
geodienste.hamburg.de are down:

  - Verwaltungsgrenzen (Stadtteile / Bezirke / Landesgrenze) — Gebietsauswahl
  - all regionalstatistik OAF collections x all districts     — Dashboard/Choroplethen
  - HVV Haltestellen + Staatliche Schulen (WFS)               — Fachdaten
  - style_v3.json + referenced style icons                    — map styling

The nginx cache key is the RAW request URI, so URLs must match the app
byte-for-byte. The two encoders below therefore replicate exactly what the
frontend uses: encodeURIComponent (COSI getOAFFeatureGet, string-concatenated
query) and the WHATWG URLSearchParams serializer (masterportalapi createUrl).
The configs are fetched THROUGH the portal, i.e. already host-rewritten by
nginx sub_filter — the script never needs to know the proxy paths.

Usage:  deploy/warm-hh-cache.py [BASE_URL]      default: http://localhost:8080
Needs only the Python 3 standard library.
"""

import json
import re
import sys
import urllib.error
import urllib.parse
import urllib.request
from collections import Counter
from concurrent.futures import ThreadPoolExecutor

BASE = (sys.argv[1] if len(sys.argv) > 1 else "http://localhost:8080").rstrip("/")
PORTAL = f"{BASE}/cosi"
# Hardcoded in addons/cosi/DistrictSelector/store/actionsDistrictSelector.js and
# defaulted in src/core/layers/js/layer2dVectorOaf.js.
CRS = "http://www.opengis.net/def/crs/EPSG/0/25832"
# Map projection (config.js namedProjections / Maps/projectionCode).
SRS = "EPSG:25832"
# Fachdaten layers to warm besides the district machinery (WFS, loadingStrategy
# "all" in config.json → a single deterministic GetFeature URL each).
EXTRA_WFS_LAYER_IDS = [
    "5246",   # HVV Haltestellen
    "8712",   # Staatliche Schulen
    # Soziale Infrastruktur — Zielgruppe Familien / Kinder / Jugendliche.
    # Warmed for the "Versorgung mit sozialer Infrastruktur" scenario; harmless
    # to keep, and missing entries here mean an empty map during an outage.
    "19944",  # Eltern-Kind-Zentrum
    "753",    # Kindertagesstätten
    "34597",  # Familienbildung und -beratung
    "19574",  # Öffentliche Bibliotheken
    "33505",  # Haus der Jugend
    "33526",  # Jugendklub
    "33561",  # Jugendcafe
    "33544",  # Kindertreff
    "33507",  # Jugendangebot im Stadtteil- oder Kulturzentrum
    "20179",  # Sozialräume
]

WORKERS = 8
stats = Counter()


def http_get(url, accept=None):
    """GET a URL, count nginx's X-Cache-Status, return the response body."""
    req = urllib.request.Request(url, headers={"Accept": accept} if accept else {})
    try:
        with urllib.request.urlopen(req, timeout=180) as resp:
            stats[resp.headers.get("X-Cache-Status", "-")] += 1
            return resp.read()
    except urllib.error.HTTPError as err:
        if err.code == 404:
            # Upstream says the resource does not exist - nothing to warm, and
            # nothing we can fix here (style_v3.json references icons that were
            # never published). Report it, but don't fail the run over it.
            stats["MISSING"] += 1
            print(f"  MISSING (404): {url[:160]}", file=sys.stderr)
            return None
        stats["ERROR"] += 1
        print(f"  ERROR {err}: {url[:160]}", file=sys.stderr)
        return None
    except Exception as err:  # noqa: BLE001 - keep warming, report at the end
        stats["ERROR"] += 1
        print(f"  ERROR {err}: {url[:160]}", file=sys.stderr)
        return None


def encode_uri_component(value):
    """Byte-exact replica of JS encodeURIComponent (keeps A-Za-z0-9 -_.!~*'())."""
    keep = set(b"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_.!~*'()")
    return "".join(chr(b) if b in keep else f"%{b:02X}" for b in value.encode())


def whatwg_urlencode(pairs):
    """Byte-exact replica of the WHATWG URLSearchParams serializer (new URL())."""
    keep = set(b"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789*-._")

    def enc(value):
        return "".join(
            "+" if b == 0x20 else chr(b) if b in keep else f"%{b:02X}"
            for b in str(value).encode()
        )

    return "&".join(f"{enc(k)}={enc(v)}" for k, v in pairs)


def get_oaf_paged(url):
    """GET an OAF items URL and every 'next' page (each page = own cache entry)."""
    features = []
    while url:
        body = http_get(url, accept="application/geo+json")
        if body is None:
            return features
        data = json.loads(body)
        features.extend(data.get("features", []))
        url = next(
            (l["href"] for l in data.get("links", [])
             if l.get("rel") == "next" and l.get("type") == "application/geo+json"),
            None,
        )
    return features


def find_district_selector(node):
    """Find the districtSelector section anywhere in config.json."""
    if isinstance(node, dict):
        if node.get("type") == "districtSelector" and "districtLevels" in node:
            return node
        for value in node.values():
            if (found := find_district_selector(value)) is not None:
                return found
    elif isinstance(node, list):
        for value in node:
            if (found := find_district_selector(value)) is not None:
                return found
    return None


def district_names(features, level):
    """District names as loadStatFeatures queries them: getName() 'St. ' fix,
    then districtNamesMap synonyms (prepareDistrictLevels.js / mapDistrictNames)."""
    names = []
    for feature in features:
        name = feature.get("properties", {}).get(level["keyOfAttrName"])
        if not isinstance(name, str):
            continue
        if "St. " in name:
            name = name.replace(" ", "", 1)
        names.append(level.get("districtNamesMap", {}).get(name, name))
    return sorted(set(names))


def main():
    print(f"Warming Hamburg-upstream cache via {BASE}")
    config = json.loads(http_get(f"{PORTAL}/config.json"))
    services = {s["id"]: s for s in json.loads(http_get(f"{PORTAL}/services.json"))}
    config_js = http_get(f"{PORTAL}/config.js").decode()

    # --- style config + icons (geodienste/lgv-config) -----------------------
    style_conf = re.search(r'styleConf:\s*"([^"]+)"', config_js)[1]
    img_path = re.search(r'wfsImgPath:\s*"([^"]+)"', config_js)[1]
    styles = json.loads(http_get(style_conf))
    # ensure_ascii=False: with the default the re-encoded JSON escapes umlauts, so
    # "Icon-Spaß-am-Wasser.png" would be searched for as literal "Icon-Spaß-...".
    icons = sorted({m for m in re.findall(r'"imageName":\s*"([^"/]+\.\w{3,4})"',
                                          json.dumps(styles, ensure_ascii=False))})
    print(f"style_v3.json + {len(icons)} style icons")
    with ThreadPoolExecutor(WORKERS) as pool:
        # quote(): non-ASCII icon names must be percent-encoded, urllib only speaks
        # ASCII urls. The app's <img src> encodes them the same way, same cache key.
        pool.map(lambda i: http_get(f"{img_path}{urllib.parse.quote(i)}"), icons)

    # --- extra WFS Fachdaten layers (masterportalapi wfs.js createUrl) ------
    for layer_id in EXTRA_WFS_LAYER_IDS:
        svc = services.get(layer_id)
        if svc is None:
            # A registry rebuild drops layers retired upstream; warming the rest is
            # still worth more than aborting the whole run over one dead id.
            stats["ERROR"] += 1
            print(f"  ERROR unknown layer id {layer_id} in services.json", file=sys.stderr)
            continue
        query = whatwg_urlencode([
            ("service", "WFS"), ("version", svc["version"]), ("request", "GetFeature"),
            ("srsName", SRS), ("typeName", svc["featureType"]),
        ])
        print(f"WFS {svc['name']} ({layer_id})")
        http_get(f"{svc['url']}?{query}")

    # --- district levels: boundaries + full stats matrix ---------------------
    selector = find_district_selector(config)
    for level in selector["districtLevels"]:
        boundary = services[level["layerId"]]
        # masterportalapi oaf.js createUrl (loadingStrategy "all" → no bbox)
        boundary_url = (f"{boundary['url']}/collections/{boundary['collection']}/items?"
                        + whatwg_urlencode([("limit", 400), ("crs", CRS)]))
        features = get_oaf_paged(boundary_url)
        names = district_names(features, level)
        # Self-hosted statistics (portal/cosi/assets/*.geojson, registered via
        # tools/local-services.json) are served by this nginx itself - no Hamburg
        # upstream to warm, and no OAF collection to page.
        stat_layers = [(lid, key) for lid, key
                       in zip(level["stats"]["layerIds"], level["stats"]["keyOfAttrName"])
                       if services.get(lid, {}).get("typ") == "OAF"]
        print(f"{level['label']}: {len(names)} districts x {len(stat_layers)} stats collections")

        def stat_urls(level_names=names, stats_layers=stat_layers):
            # COSI getOAFFeatureGet: string-concatenated query, only the filter
            # value runs through encodeURIComponent (getOAFFeature.js:62-89).
            for layer_id, key in stats_layers:
                svc = services[layer_id]
                for name in level_names:
                    fltr = encode_uri_component(f"{key}='{name}'")
                    yield (f"{svc['url']}/collections/{svc['collection']}/items"
                           f"?limit=400&filter={fltr}&filter-crs={CRS}&crs={CRS}"
                           f"&skipGeometry=true")

        with ThreadPoolExecutor(WORKERS) as pool:
            pool.map(get_oaf_paged, stat_urls())

    print(f"\nDone. X-Cache-Status: {dict(stats)}")
    if stats["MISSING"]:
        print(f"{stats['MISSING']} resource(s) do not exist upstream (404) - see above.")
    if stats["ERROR"]:
        sys.exit(1)


if __name__ == "__main__":
    main()
