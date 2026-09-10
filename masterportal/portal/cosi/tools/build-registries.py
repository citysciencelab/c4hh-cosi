#!/usr/bin/env python3
"""
Build our self-hosted COSI service registries (BACKLOG §6).

Generates a *pruned* ``services.json`` and a ``rest-services.json`` next to
``config.js`` from Hamburg's public upstream registries, so the portal no longer
downloads the full 6551-entry catalogue at startup and we control the layer list
+ can add our own services (notably self-hosted Valhalla routing).

What it does
------------
* ``services.json``      = only the layers actually referenced by ``config.json``
                          *and* present in the public upstream (FHHNET-only / removed
                          layers are dropped automatically and reported). Entries are
                          copied verbatim, original order preserved.
* ``rest-services.json`` = the full public rest-services set (it is tiny, ~10 KB, and
                          addon code references ids not visible in config.json — e.g.
                          the WPS ``1001`` population service) **plus** a ``valhalla``
                          entry for AccessibilityAnalysis (BACKLOG §3).

Re-run this whenever ``config.json`` changes so the pruned catalogue never drifts.

Usage
-----
    python3 tools/build-registries.py [--refresh] [--valhalla-url URL]

``--refresh`` re-downloads the upstream registries (otherwise a local cache under
``tools/.cache/`` is reused). The Valhalla base URL defaults to
``http://localhost:8002`` (dev); in the Docker/nginx deploy it becomes ``/valhalla``.
"""
import argparse
import json
import sys
import urllib.request
from collections import Counter
from pathlib import Path

PORTAL_DIR = Path(__file__).resolve().parent.parent
CONFIG_JSON = PORTAL_DIR / "config.json"
CACHE_DIR = PORTAL_DIR / "tools" / ".cache"
# Hand-maintained service definitions that do not exist upstream (self-hosted
# GeoJSON derived from several Hamburg sources, e.g. the combined "Jugendorte"
# layer). Merged into the generated services.json so a regeneration does not
# drop them; an entry here wins over an upstream entry with the same id.
LOCAL_SERVICES_JSON = PORTAL_DIR / "tools" / "local-services.json"

UPSTREAM = {
    "services": "https://geodienste.hamburg.de/services-internet.json",
    "rest": "https://geodienste.hamburg.de/lgv-config/rest-services-internet.json",
}

# The metadata host ``hmdk.metaver.de`` answers 403 on EVERY path (whole vhost,
# not just /csw) since ~2026-09, which makes the layer info panel report "Es
# konnten keine Metadaten geladen werden!" and, in the browser console, a CORS
# error -- the 403 page simply carries no Access-Control-Allow-Origin. Plain
# ``metaver.de`` serves the same records with ``Access-Control-Allow-Origin: *``,
# and most upstream entries already use it. Upstream still ships the dead host
# for a minority of layers, so rewrite it on the way out; otherwise every
# regeneration silently reintroduces layers with unreachable metadata.
DEAD_METADATA_HOST = "hmdk.metaver.de"
METADATA_HOST = "metaver.de"


def fetch(name, url, refresh):
    """Download an upstream registry (cached). Returns parsed JSON (BOM-tolerant)."""
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    cache = CACHE_DIR / f"{name}-internet.json"
    if refresh or not cache.exists():
        print(f"  downloading {url}")
        with urllib.request.urlopen(url, timeout=60) as r:
            cache.write_bytes(r.read())
    return json.loads(cache.read_text(encoding="utf-8-sig"))


def referenced_layer_ids(config):
    """Collect every layer id referenced anywhere in config.json.

    Covers the layer tree (``id``) and the tool blocks: districtSelector
    (``layerId`` / ``stats.layerIds``), districtFinder (``selectedLevelId``) and
    ``additionalInfoLayers`` (label -> [ids]). Non-layer ``id`` values (menu/tool
    ids, gfiAttribute keys) are harmless: they are filtered out by intersecting
    with the real registry.
    """
    refs = set()

    def walk(node):
        if isinstance(node, dict):
            for key, val in node.items():
                if key in ("id", "layerId", "selectedLevelId") and isinstance(val, (str, int)):
                    refs.add(str(val))
                elif key == "layerIds" and isinstance(val, list):
                    refs.update(str(x) for x in val)
                elif key == "additionalInfoLayers" and isinstance(val, dict):
                    for lst in val.values():
                        if isinstance(lst, list):
                            refs.update(str(x) for x in lst)
                else:
                    walk(val)
        elif isinstance(node, list):
            for val in node:
                walk(val)

    walk(config)
    return refs


def normalize_metadata_hosts(entries):
    """Rewrite DEAD_METADATA_HOST to METADATA_HOST in every string, in place.

    Covers ``csw_url`` / ``show_doc_url`` and anything else the registries carry;
    a bare host swap is enough, both ``/trefferanzeige`` query forms answer 200.
    Returns the number of strings changed.
    """
    changed = 0

    def swap(val):
        nonlocal changed
        changed += 1
        return val.replace(DEAD_METADATA_HOST, METADATA_HOST)

    def walk(node):
        if isinstance(node, dict):
            for key, val in node.items():
                if isinstance(val, str):
                    if DEAD_METADATA_HOST in val:
                        node[key] = swap(val)
                else:
                    walk(val)
        elif isinstance(node, list):
            for idx, val in enumerate(node):
                if isinstance(val, str):
                    if DEAD_METADATA_HOST in val:
                        node[idx] = swap(val)
                else:
                    walk(val)

    walk(entries)
    return changed


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--refresh", action="store_true", help="re-download upstream registries")
    ap.add_argument("--valhalla-url", default="http://localhost:8002",
                    help="Valhalla base URL (dev default http://localhost:8002; prod /valhalla)")
    args = ap.parse_args()

    config = json.loads(CONFIG_JSON.read_text(encoding="utf-8"))
    services_up = fetch("services", UPSTREAM["services"], args.refresh)
    rest_up = fetch("rest", UPSTREAM["rest"], args.refresh)

    local_services = []
    if LOCAL_SERVICES_JSON.exists():
        local_services = json.loads(LOCAL_SERVICES_JSON.read_text(encoding="utf-8-sig"))
    local_by_id = {str(e["id"]): e for e in local_services if isinstance(e, dict) and "id" in e}

    by_id = {str(e["id"]): e for e in services_up if isinstance(e, dict) and "id" in e}
    by_id.update(local_by_id)
    refs = referenced_layer_ids(config)

    keep_ids = {r for r in refs if r in by_id}
    not_public = sorted(
        (r for r in refs if r.isdigit() and r not in by_id), key=lambda x: (len(x), x))

    # preserve upstream order; emit only kept entries, then append our own
    services_out = [e for e in services_up
                    if str(e.get("id")) in keep_ids and str(e.get("id")) not in local_by_id]
    services_out += [e for e in local_services if str(e.get("id")) in keep_ids]

    # rest-services: full upstream + our Valhalla entry (replace if already present)
    rest_out = [e for e in rest_up if str(e.get("id")) != "valhalla"]
    rest_out.append({
        "id": "valhalla",
        "name": "Self-hosted Valhalla routing (COSI)",
        "url": args.valhalla_url,
        "typ": "Valhalla",
    })

    metadata_fixes = normalize_metadata_hosts(services_out) + normalize_metadata_hosts(rest_out)

    (PORTAL_DIR / "services.json").write_text(
        json.dumps(services_out, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    (PORTAL_DIR / "rest-services.json").write_text(
        json.dumps(rest_out, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    typs = Counter(e.get("typ") for e in services_out)
    print(f"\nservices.json:      {len(services_out)} layers kept "
          f"(of {len(by_id)} upstream)  typ={dict(typs)}")
    if local_by_id:
        used = sorted(i for i in local_by_id if i in keep_ids)
        unused = sorted(i for i in local_by_id if i not in keep_ids)
        print(f"local-services.json: {len(used)} merged {used}"
              + (f"; not referenced by config.json: {unused}" if unused else ""))
    print(f"rest-services.json: {len(rest_out)} entries (incl. valhalla -> {args.valhalla_url})")
    print(f"metadata hosts:     {metadata_fixes} url(s) rewritten "
          f"{DEAD_METADATA_HOST} -> {METADATA_HOST}")
    print(f"\nreferenced but NOT in public registry — omitted ({len(not_public)}):")
    print("  " + ", ".join(not_public))
    print("\n(These FHHNET-only / retired layers should also be pruned from config.json's "
          "layer tree so they stop showing as broken catalogue entries.)")


if __name__ == "__main__":
    sys.exit(main())
