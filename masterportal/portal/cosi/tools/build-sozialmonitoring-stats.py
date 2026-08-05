#!/usr/bin/env python3
"""
Aggregate Hamburg's Sozialmonitoring index to Stadtteil level for COSI.

Why this needs doing at all
---------------------------
The Sozialmonitoring is published per *statistisches Gebiet* (~940 areas) and its
indices are ORDINAL CLASSES, not numbers: Statusindex is one of "hoch", "mittel",
"niedrig", "sehr niedrig", Dynamikindex one of "positiv", "stabil", "negativ".
COSI works on Stadtteile and can only calculate with numbers, so two conversions
are unavoidable before the index can be related to infrastructure supply:

1. classes -> scores (see STATUS_SCORES / DYNAMIK_SCORES below), and
2. statistische Gebiete -> Stadtteil, weighted by population, because a Stadtteil
   is not one area but several of very different size. An unweighted mean would
   let a 300-inhabitant area count as much as a 12.000-inhabitant one.

Both steps are choices, not facts. They are declared here in one place so they
can be stated out loud and changed if a reviewer disagrees.

Output
------
``assets/sozialmonitoring-stadtteile.geojson`` — one geometry-less feature per
Stadtteil and year, in the wide "long table format" COSI's DistrictSelector
expects (attributes ``stadtteil``, ``jahr`` plus one column per indicator).

Columns produced (all per Stadtteil and year):
  sm_statusindex_score        population weighted mean status score (1..4)
  sm_dynamikindex_score       population weighted mean dynamic score (-1..1)
  sm_anteil_niedrig_proz      % of inhabitants in areas of status "niedrig"
                              or "sehr niedrig"  <- the headline number
  sm_bev_niedrig              inhabitants in those areas (absolute)
  sm_bev_gesamt               inhabitants covered by the monitoring
  sm_gebiete_anz              number of statistische Gebiete
  sm_gebiete_niedrig_anz      of those, with status niedrig / sehr niedrig

Usage
-----
    python3 tools/build-sozialmonitoring-stats.py [--out PATH]

Note: api.hamburg.de is updated nightly and returns 5xx/timeouts roughly between
22:00 and 05:00 — run this outside that window.
"""
import argparse
import json
import sys
import urllib.parse
import urllib.request
from collections import defaultdict
from pathlib import Path

PORTAL_DIR = Path(__file__).resolve().parent.parent
DEFAULT_OUT = PORTAL_DIR / "assets" / "sozialmonitoring-stadtteile.geojson"

BASE = "https://api.hamburg.de/datasets/v1/sozialmonitoring"
COLLECTION = "sozialmonitoring"
PAGE = 1000
TIMEOUT = 180

# Ordinal status classes -> score. Higher = better off, so a LOW score marks a
# district under social strain. Equidistant steps are an assumption; the
# monitoring itself makes no claim that "hoch"->"mittel" equals "niedrig"->"sehr
# niedrig". Reported alongside sm_anteil_niedrig_proz, which needs no such
# assumption and is therefore the safer headline figure.
STATUS_SCORES = {
    "hoch": 4.0,
    "mittel": 3.0,
    "niedrig": 2.0,
    "sehr niedrig": 1.0,
}
DYNAMIK_SCORES = {
    "positiv": 1.0,
    "stabil": 0.0,
    "negativ": -1.0,
}
# Status classes counted as "unter Beobachtung" for the headline share.
LOW_STATUS = {"niedrig", "sehr niedrig"}

# Stadtteil names normalised to what the DistrictSelector's stats machinery looks
# up (mirror of districtNamesMap in config.json). Two separate issues hide here:
#   * the district level merges small Stadtteile into pairs, so their areas must
#     be aggregated under the combined name (population weighting handles that), and
#   * the source data spells St. Pauli / St. Georg WITH and WITHOUT the space,
#     varying by year — without normalisation half the time series silently drops.
NAME_MAP = {
    "St.Pauli": "St. Pauli",
    "St:Pauli": "St. Pauli",   # yes, with a colon — 2013/2014 vintage
    "St.Georg": "St. Georg",
    "Steinwerder": "Steinwerder/Kl. Grasbrook",
    "Kleiner Grasbrook": "Steinwerder/Kl. Grasbrook",
    "Waltershof": "Waltershof/Finkenwerder",
    "Finkenwerder": "Waltershof/Finkenwerder",
    "Moorburg": "Moorburg/Altenwerder",
    "Altenwerder": "Moorburg/Altenwerder",
    "Neuland": "Neuland/Gut Moor",
    "Gut Moor": "Neuland/Gut Moor",
    # missing-space vintages — without these the whole district joins nothing
    "GroßBorstel": "Groß Borstel",
    "GroßFlottbek": "Groß Flottbek",
    "KleinerGrasbrook": "Steinwerder/Kl. Grasbrook",
    # early vintages still carry the pre-2011 Hamm split; aggregate into "Hamm"
    "Hamm-Mitte": "Hamm",
    "Hamm-Nord": "Hamm",
    "Hamm-Süd": "Hamm",
}


def normalise(value):
    """Class labels differ in case/spacing between years; compare them normalised."""
    return " ".join(str(value or "").strip().lower().split())


def fetch_all():
    """Page through the collection. Geometry is skipped: we aggregate by attribute."""
    features, offset = [], 0
    while True:
        query = urllib.parse.urlencode({
            "limit": PAGE, "offset": offset, "skipGeometry": "true", "f": "json"})
        url = f"{BASE}/collections/{COLLECTION}/items?{query}"
        with urllib.request.urlopen(url, timeout=TIMEOUT) as response:
            payload = json.loads(response.read().decode("utf-8-sig"))
        batch = payload.get("features", [])
        if not batch:
            break
        features += [f.get("properties", {}) for f in batch]
        print(f"  {len(features)} / {payload.get('numberMatched', '?')}")
        if len(batch) < PAGE:
            break
        offset += PAGE
    return features


def aggregate(rows):
    """Population weighted aggregation of statistische Gebiete to Stadtteil/year."""
    buckets = defaultdict(list)
    unknown_status, unknown_dynamik = set(), set()

    for row in rows:
        stadtteil = (row.get("stadtteil") or "").strip()
        jahr = row.get("jahr")
        if not stadtteil or jahr is None:
            continue
        stadtteil = NAME_MAP.get(stadtteil, stadtteil)
        buckets[(stadtteil, str(jahr))].append(row)

    out = []
    for (stadtteil, jahr), items in sorted(buckets.items()):
        total_pop = status_pop = status_weighted = 0.0
        dynamik_pop = dynamik_weighted = 0.0
        low_pop = low_count = 0.0

        for row in items:
            population = row.get("bevoelkerung") or 0
            total_pop += population

            status = normalise(row.get("statusindex"))
            if status in STATUS_SCORES:
                status_weighted += STATUS_SCORES[status] * population
                status_pop += population
                if status in LOW_STATUS:
                    low_pop += population
                    low_count += 1
            elif status:
                unknown_status.add(status)

            dynamik = normalise(row.get("dynamikindex"))
            if dynamik in DYNAMIK_SCORES:
                dynamik_weighted += DYNAMIK_SCORES[dynamik] * population
                dynamik_pop += population
            elif dynamik:
                unknown_dynamik.add(dynamik)

        # Areas without a classification (or without inhabitants) must not silently
        # count as average — they are excluded from the weighting entirely.
        out.append({
            "stadtteil": stadtteil,
            "jahr": jahr,
            "sm_statusindex_score": round(status_weighted / status_pop, 3) if status_pop else None,
            "sm_dynamikindex_score": round(dynamik_weighted / dynamik_pop, 3) if dynamik_pop else None,
            "sm_anteil_niedrig_proz": round(low_pop / status_pop * 100, 1) if status_pop else None,
            "sm_bev_niedrig": int(low_pop),
            "sm_bev_gesamt": int(total_pop),
            "sm_gebiete_anz": len(items),
            "sm_gebiete_niedrig_anz": int(low_count),
        })

    if unknown_status:
        print(f"  !! unbekannte Statusklassen ignoriert: {sorted(unknown_status)}")
    if unknown_dynamik:
        print(f"  !! unbekannte Dynamikklassen ignoriert: {sorted(unknown_dynamik)}")

    # Names differing only in punctuation/spacing are almost certainly the same
    # Stadtteil in a different vintage (St.Pauli / St:Pauli / St. Pauli all exist
    # upstream). Anything NAME_MAP does not yet cover should be loud, not silent:
    # an unmapped variant splits one district's time series into two partials.
    by_slug = defaultdict(set)
    for stadtteil, _jahr in buckets:
        by_slug["".join(ch for ch in stadtteil.lower() if ch.isalnum())].add(stadtteil)
    for slug, variants in sorted(by_slug.items()):
        if len(variants) > 1:
            print(f"  !! Namensvarianten nicht zusammengeführt (NAME_MAP ergänzen): {sorted(variants)}")
    return out


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--out", type=Path, default=DEFAULT_OUT)
    args = parser.parse_args()

    print("Lade Sozialmonitoring …")
    try:
        rows = fetch_all()
    except Exception as exc:                                      # noqa: BLE001
        sys.exit(f"Abbruch: {exc}\n(api.hamburg.de wird nachts ~22-05 Uhr aktualisiert.)")
    if not rows:
        sys.exit("Abbruch: keine Datensätze erhalten.")

    records = aggregate(rows)
    years = sorted({r["jahr"] for r in records})
    districts = sorted({r["stadtteil"] for r in records})
    print(f"\n{len(records)} Datensätze: {len(districts)} Stadtteile x {len(years)} Jahre "
          f"({years[0]}-{years[-1]})")

    collection = {
        "type": "FeatureCollection",
        "name": "sozialmonitoring_stadtteile",
        "features": [{"type": "Feature", "geometry": None, "properties": r} for r in records],
    }
    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text(json.dumps(collection, ensure_ascii=False), encoding="utf-8")
    print(f"-> {args.out.relative_to(PORTAL_DIR)}")

    newest = [r for r in records if r["jahr"] == years[-1]]
    newest.sort(key=lambda r: (r["sm_anteil_niedrig_proz"] is None, -(r["sm_anteil_niedrig_proz"] or 0)))
    print(f"\nHöchster Anteil Bevölkerung in Gebieten mit niedrigem Status ({years[-1]}):")
    for r in newest[:10]:
        print(f"   {r['stadtteil']:<28}{r['sm_anteil_niedrig_proz']:>6} %"
              f"   Score {r['sm_statusindex_score']}   ({r['sm_gebiete_anz']} Gebiete)")


if __name__ == "__main__":
    main()
