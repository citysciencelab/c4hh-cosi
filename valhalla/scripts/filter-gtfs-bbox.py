#!/usr/bin/env python3
"""Spatially filter a GTFS feed to a lon/lat bounding box, in place.

Why: Valhalla connects every transit stop to the road graph during the enhance
step. If a stop lies outside the OSM extract (no nearby road), that version
aborts the whole build with std::bad_array_new_length ("Could not find
connection point for in/egress near ..."). The HVV feed spans the entire
metropolitan region (lat 51.5..54.9), but our OSM extract is Hamburg-only, so
~60% of stops have no road. We drop stops outside the extract's bbox so every
remaining stop connects.

Keeps referential integrity: drop out-of-box stops (but keep parent stations of
kept stops), then cascade — stop_times -> trips (need >=2 stops) -> routes /
shapes / frequencies / transfers. Re-runnable; operates on the unzipped feed dir.

Usage: filter-gtfs-bbox.py <feed_dir> <min_lon> <min_lat> <max_lon> <max_lat>
"""
import csv
import os
import sys

csv.field_size_limit(10 ** 7)


def read(path):
    """Read a GTFS csv; return (fieldnames, list-of-dict-rows) or (None, [])."""
    if not os.path.exists(path):
        return None, []
    with open(path, encoding="utf-8-sig", newline="") as handle:
        reader = csv.DictReader(handle)
        return reader.fieldnames, list(reader)


def write(path, fields, rows):
    if fields is None:
        return
    with open(path, "w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fields, quoting=csv.QUOTE_NONNUMERIC)
        writer.writeheader()
        writer.writerows(rows)


def main():
    if len(sys.argv) != 6:
        sys.exit(__doc__)
    feed = sys.argv[1]
    min_lon, min_lat, max_lon, max_lat = (float(v) for v in sys.argv[2:6])

    def path(name):
        return os.path.join(feed, name)

    # 1. stops: keep those inside the bbox, plus parent stations of kept stops.
    stops_f, stops = read(path("stops.txt"))
    inside = set()
    by_id = {}
    for s in stops:
        by_id[s["stop_id"]] = s
        try:
            lon, lat = float(s["stop_lon"]), float(s["stop_lat"])
        except (ValueError, KeyError):
            continue
        if min_lon <= lon <= max_lon and min_lat <= lat <= max_lat:
            inside.add(s["stop_id"])
    # pull in parent stations so kept stops keep their hierarchy
    for sid in list(inside):
        parent = by_id.get(sid, {}).get("parent_station")
        while parent and parent in by_id and parent not in inside:
            inside.add(parent)
            parent = by_id[parent].get("parent_station")
    keep_stops = [s for s in stops if s["stop_id"] in inside]

    # 2. stop_times: keep only rows whose stop survived.
    st_f, stop_times = read(path("stop_times.txt"))
    kept_st = [r for r in stop_times if r["stop_id"] in inside]

    # 3. trips: keep trips that still have >= 2 stops (a routable trip).
    counts = {}
    for r in kept_st:
        counts[r["trip_id"]] = counts.get(r["trip_id"], 0) + 1
    keep_trips = {tid for tid, n in counts.items() if n >= 2}
    kept_st = [r for r in kept_st if r["trip_id"] in keep_trips]
    trips_f, trips = read(path("trips.txt"))
    keep_trip_rows = [t for t in trips if t["trip_id"] in keep_trips]

    # 4. cascade route_id / shape_id from surviving trips.
    keep_routes = {t["route_id"] for t in keep_trip_rows if t.get("route_id")}
    keep_shapes = {t.get("shape_id") for t in keep_trip_rows if t.get("shape_id")}
    routes_f, routes = read(path("routes.txt"))
    shapes_f, shapes = read(path("shapes.txt"))
    freq_f, freqs = read(path("frequencies.txt"))
    tr_f, transfers = read(path("transfers.txt"))

    out = {
        "stops.txt": (stops_f, keep_stops),
        "stop_times.txt": (st_f, kept_st),
        "trips.txt": (trips_f, keep_trip_rows),
        "routes.txt": (routes_f, [r for r in routes if r["route_id"] in keep_routes]),
        "shapes.txt": (shapes_f, [s for s in shapes if s["shape_id"] in keep_shapes]),
        "frequencies.txt": (freq_f, [f for f in freqs if f["trip_id"] in keep_trips]),
        "transfers.txt": (tr_f, [t for t in transfers
                                 if t.get("from_stop_id", "") in inside
                                 and t.get("to_stop_id", "") in inside]),
    }
    for name, (fields, rows) in out.items():
        write(path(name), fields, rows)

    print(f"filter-gtfs-bbox: stops {len(stops)}->{len(keep_stops)}, "
          f"trips {len(trips)}->{len(keep_trip_rows)}, "
          f"stop_times {len(stop_times)}->{len(kept_st)}, "
          f"routes {len(routes)}->{len(out['routes.txt'][1])}")


if __name__ == "__main__":
    main()
