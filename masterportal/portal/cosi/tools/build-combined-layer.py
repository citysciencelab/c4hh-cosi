#!/usr/bin/env python3
"""
Build a combined "one target group, many offer types" GeoJSON layer.

Why
---
The Versorgungsanalyse (CalculateRatio) relates exactly ONE facility layer to a
demand figure. Reality does not work that way: a teenager is served by a Haus der
Jugend, a Jugendklub, a Bücherhalle with a youth programme or a Kulturzentrum
alike. Counting only one of those understates supply everywhere and understates
it *unevenly*, because districts differ in which offer type they happen to have.

This script fetches several Hamburg WFS layers, tags every feature with the
offer type it came from and writes them into a single GeoJSON that behaves like
any other point layer in COSI — usable in the Versorgungsanalyse, the
Erreichbarkeitsanalyse and the Einrichtungsübersicht.

Curation is deliberate and visible: the SETS below say exactly what counts as
"an offer for this target group", which is the part a presentation has to be
able to defend.

Usage
-----
    python3 tools/build-combined-layer.py                # build every set
    python3 tools/build-combined-layer.py jugendorte     # build one set

Writes assets/<set>.geojson (EPSG:25832, the portal's projection) and prints the
composition. Register the result in tools/local-services.json and reference the
id from config.json, then re-run tools/build-registries.py.
"""
import json
import sys
import urllib.parse
import urllib.request
from collections import Counter
from pathlib import Path

PORTAL_DIR = Path(__file__).resolve().parent.parent
SERVICES_JSON = PORTAL_DIR / "services.json"
ASSETS_DIR = PORTAL_DIR / "assets"
TIMEOUT = 120

# Combined layers to build: output name -> {layer id: offer type label}.
# The label lands on each feature as "angebotstyp" and is what the
# Einrichtungsübersicht / GFI shows, so keep it human readable.
SETS = {
    # Offene Angebote für Jugendliche (ca. 10-18). Deliberately excludes
    # Kindertreff/Spielhaus/Bauspielplatz (younger target group) and the purely
    # administrative OKJA entries (Qualifizierung, mittelbare Unterstützung).
    "jugendorte": {
        "33505": "Haus der Jugend",
        "33526": "Jugendklub",
        "33561": "Jugendcafé",
        "33545": "Mädchentreff",
        "33507": "Jugendangebot im Stadtteil-/Kulturzentrum",
        "33550": "Sonstiges Kulturangebot (OKJA)",
        "33539": "Freizeitprogramm für junge Menschen",
        "19574": "Öffentliche Bücherhalle",
    },
    # Anlaufstellen für Familien mit kleinen Kindern (Zielgruppe u6).
    # 34597 carries the retired Mütterzentrum / Kinder-Familienzentrum layers as
    # kategorie_2 values, so it enters as a whole and stays distinguishable.
    "familienorte": {
        "19944": "Eltern-Kind-Zentrum",
        "34597": "Familienbildung und -beratung",
        "19947": "Familienteam",
        "19948": "Institutionelle Erziehungsberatung",
        "19950": "Konfessionelle Familienbildungsstätte",
    },
}

# Attributes worth carrying over, in output order. Anything else is dropped so
# the combined layer has one predictable schema instead of the union of five.
KEEP = ["einrichtung", "kategorie", "kategorie_2", "traeger", "adresse", "ort",
        "link", "internet", "telefon", "strasse", "hausnummer", "plz", "name",
        "bezeichnung", "traegername"]


def load_services():
    """Map layer id -> service entry, tolerating the list-valued ids upstream uses."""
    services = json.loads(SERVICES_JSON.read_text(encoding="utf-8-sig"))
    by_id = {}
    for entry in services:
        raw = entry.get("id")
        ids = [str(x) for x in raw] if isinstance(raw, list) else [str(raw)]
        for i in ids:
            by_id.setdefault(i, entry)
    return by_id


def fetch_wfs_geojson(entry):
    """GetFeature as GeoJSON in EPSG:25832. Returns the feature list."""
    params = {
        "SERVICE": "WFS",
        "VERSION": "2.0.0",
        "REQUEST": "GetFeature",
        "TYPENAMES": f"{entry.get('featurePrefix', 'de.hh.up')}:{entry['featureType']}",
        "SRSNAME": "urn:ogc:def:crs:EPSG::25832",
        "outputFormat": "application/geo+json",
    }
    url = entry["url"] + "?" + urllib.parse.urlencode(params, safe=":")
    with urllib.request.urlopen(url, timeout=TIMEOUT) as response:
        payload = response.read().decode("utf-8-sig")
    if not payload.lstrip().startswith("{"):
        raise RuntimeError(f"not GeoJSON (WFS exception?): {payload[:200]}")
    return json.loads(payload).get("features", [])


def centroid(geometry):
    """Reduce any geometry to a representative point.

    COSI counts a facility into a district via the centre of its extent
    (CalculateRatio.coverageFunction), so collapsing to a point here keeps the
    combined layer consistent with how the tool would have counted the originals.
    """
    if geometry is None:
        return None
    if geometry["type"] == "Point":
        return list(geometry["coordinates"][:2])
    coords, stack = [], [geometry["coordinates"]]
    while stack:
        item = stack.pop()
        if isinstance(item, (int, float)):
            continue
        if item and isinstance(item[0], (int, float)):
            coords.append(item[:2])
        else:
            stack.extend(item)
    if not coords:
        return None
    xs = [c[0] for c in coords]
    ys = [c[1] for c in coords]
    return [(min(xs) + max(xs)) / 2, (min(ys) + max(ys)) / 2]


def dedupe_key(props, point):
    """Same house number + same name = same place, however many layers list it."""
    name = (props.get("einrichtung") or props.get("name") or props.get("bezeichnung") or "").strip().lower()
    address = (props.get("adresse") or props.get("strasse") or "").strip().lower()
    if name and address:
        return f"{name}|{address}"
    return f"@{round(point[0], 1)},{round(point[1], 1)}|{name}"


def build(set_name, layers, by_id):
    features, seen, stats, skipped = [], {}, Counter(), Counter()

    for layer_id, label in layers.items():
        entry = by_id.get(layer_id)
        if not entry:
            print(f"  !! {layer_id} ({label}): not in services.json - skipped")
            skipped["missing service"] += 1
            continue
        try:
            raw = fetch_wfs_geojson(entry)
        except Exception as exc:                                  # noqa: BLE001
            print(f"  !! {layer_id} ({label}): {exc}")
            skipped["fetch failed"] += 1
            continue

        added = 0
        for feature in raw:
            point = centroid(feature.get("geometry"))
            if point is None:
                skipped["no geometry"] += 1
                continue
            props = {k: v for k, v in (feature.get("properties") or {}).items()
                     if k in KEEP and v not in (None, "")}
            key = dedupe_key(props, point)
            if key in seen:
                # Keep the first hit but record that another offer type sits here.
                other = seen[key]["properties"]
                if label not in other["angebotstyp"]:
                    other["weitere_angebotstypen"] = ", ".join(
                        filter(None, [other.get("weitere_angebotstypen"), label]))
                skipped["duplicate"] += 1
                continue
            props.update({"angebotstyp": label, "quelle_layer": layer_id})
            built = {"type": "Feature",
                     "geometry": {"type": "Point", "coordinates": point},
                     "properties": props}
            seen[key] = built
            features.append(built)
            added += 1
        stats[label] = added
        print(f"  {label:<44} {added:>4} von {len(raw)}")

    collection = {
        "type": "FeatureCollection",
        "name": set_name,
        "crs": {"type": "name",
                "properties": {"name": "urn:ogc:def:crs:EPSG::25832"}},
        "features": features,
    }
    out = ASSETS_DIR / f"{set_name}.geojson"
    out.write_text(json.dumps(collection, ensure_ascii=False), encoding="utf-8")
    print(f"  -> {out.relative_to(PORTAL_DIR)}  {len(features)} Einrichtungen"
          + (f"  (übersprungen: {dict(skipped)})" if skipped else ""))
    return len(features)


def main():
    wanted = sys.argv[1:] or list(SETS)
    unknown = [w for w in wanted if w not in SETS]
    if unknown:
        sys.exit(f"unknown set(s): {unknown}. available: {list(SETS)}")

    by_id = load_services()
    ASSETS_DIR.mkdir(parents=True, exist_ok=True)
    for set_name in wanted:
        print(f"\n### {set_name}")
        build(set_name, SETS[set_name], by_id)


if __name__ == "__main__":
    main()
