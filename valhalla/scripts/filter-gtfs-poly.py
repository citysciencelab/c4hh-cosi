#!/usr/bin/env python3
"""Spatially filter a GTFS feed to an OSM .poly boundary, in place.

Why: Valhalla aborts the transit build when a stop has no road to connect to
("Could not find connection point for in/egress"). Stops must lie inside the OSM
extract. A rectangular bbox can't match an irregular extract boundary, so we
filter against the extract's actual Geofabrik .poly polygon (point-in-polygon).
Every kept stop is then inside the road network and connects cleanly.

Keeps referential integrity (same cascade as filter-gtfs-bbox.py): drop out-of-
polygon stops (keep parent stations of kept stops), then stop_times -> trips
(>=2 stops) -> routes / shapes / frequencies / transfers. Re-runnable.

Usage: filter-gtfs-poly.py <feed_dir> <boundary.poly>
"""
import csv
import os
import sys

csv.field_size_limit(10 ** 7)


def parse_poly(path):
    """Parse an osmosis .poly file into a list of (lon, lat) rings."""
    rings, cur, in_ring = [], [], False
    with open(path, encoding="utf-8") as handle:
        lines = [ln.strip() for ln in handle]
    # line 0 is the file name; sections are: <name> ... coords ... END, then END
    for line in lines[1:]:
        if not line:
            continue
        if line == "END":
            if in_ring:
                if cur:
                    rings.append(cur)
                cur, in_ring = [], False
            continue
        parts = line.split()
        if len(parts) >= 2:
            try:
                lon, lat = float(parts[0]), float(parts[1])
                cur.append((lon, lat))
                in_ring = True
                continue
            except ValueError:
                pass
        # a ring-name line (e.g. "1", "!2") starts a new ring
        in_ring = True
        cur = []
    return rings


def in_rings(lon, lat, rings):
    """Even-odd point-in-polygon across all rings (ray casting)."""
    inside = False
    for ring in rings:
        n = len(ring)
        j = n - 1
        for i in range(n):
            xi, yi = ring[i]
            xj, yj = ring[j]
            if (yi > lat) != (yj > lat):
                x_cross = (xj - xi) * (lat - yi) / (yj - yi) + xi
                if lon < x_cross:
                    inside = not inside
            j = i
    return inside


def read(path):
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
    if len(sys.argv) != 3:
        sys.exit(__doc__)
    feed, poly = sys.argv[1], sys.argv[2]
    rings = parse_poly(poly)
    if not rings:
        sys.exit(f"no rings parsed from {poly}")

    def path(name):
        return os.path.join(feed, name)

    stops_f, stops = read(path("stops.txt"))
    by_id = {s["stop_id"]: s for s in stops}
    inside = set()
    for s in stops:
        try:
            if in_rings(float(s["stop_lon"]), float(s["stop_lat"]), rings):
                inside.add(s["stop_id"])
        except (ValueError, KeyError):
            continue
    for sid in list(inside):
        parent = by_id.get(sid, {}).get("parent_station")
        while parent and parent in by_id and parent not in inside:
            inside.add(parent)
            parent = by_id[parent].get("parent_station")
    keep_stops = [s for s in stops if s["stop_id"] in inside]

    st_f, stop_times = read(path("stop_times.txt"))
    kept_st = [r for r in stop_times if r["stop_id"] in inside]
    counts = {}
    for r in kept_st:
        counts[r["trip_id"]] = counts.get(r["trip_id"], 0) + 1
    keep_trips = {t for t, n in counts.items() if n >= 2}
    kept_st = [r for r in kept_st if r["trip_id"] in keep_trips]

    trips_f, trips = read(path("trips.txt"))
    keep_trip_rows = [t for t in trips if t["trip_id"] in keep_trips]
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

    print(f"filter-gtfs-poly: stops {len(stops)}->{len(keep_stops)}, "
          f"trips {len(trips)}->{len(keep_trip_rows)}, "
          f"routes {len(routes)}->{len(out['routes.txt'][1])} "
          f"({len(rings)} poly rings)")


if __name__ == "__main__":
    main()
