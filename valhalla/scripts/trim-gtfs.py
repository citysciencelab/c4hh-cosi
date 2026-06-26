#!/usr/bin/env python3
"""Clip a GTFS feed's active service to a short date window, in place.

Why: Valhalla materialises one transit departure per (trip, active service day).
The HVV feed spans ~9 months (calendar.txt start..end = 20260408..20261212), so a
single tile accumulates 150k-260k stop-pairs and the enhance step
(`valhalla_build_tiles -s enhance`, "Adding N transit tiles to the local graph")
aborts with std::bad_array_new_length on an oversized array. COSI only needs the
*current* schedule for reachability isochrones, so we clip the calendar to a short
window: ~19x fewer departures -> no overflow, and a much faster build.

This does NOT touch stop_times/trips/routes/shapes (the static network is
unchanged) - it only narrows which days service is active by editing calendar.txt
(clip start_date/end_date) and calendar_dates.txt (drop exceptions outside the
window). Re-runnable; operates on the unzipped feed dir produced by fetch-gtfs.sh.

Usage: trim-gtfs.py <feed_dir> <start_YYYYMMDD> <end_YYYYMMDD>
"""
import csv
import os
import sys


def clip_calendar(path, start, end):
    """Clip every service's [start_date, end_date] to the [start, end] window."""
    with open(path, encoding="utf-8-sig", newline="") as handle:
        reader = csv.DictReader(handle)
        fields = reader.fieldnames
        rows = list(reader)
    kept = 0
    for row in rows:
        row["start_date"] = max(row["start_date"], start)
        row["end_date"] = min(row["end_date"], end)
        # keep the row even if the window leaves it empty; calendar_dates may re-add days
        kept += 1
    _write(path, fields, rows)
    return kept


def filter_calendar_dates(path, start, end):
    """Drop calendar_dates exceptions outside the window."""
    if not os.path.exists(path):
        return 0, 0
    with open(path, encoding="utf-8-sig", newline="") as handle:
        reader = csv.DictReader(handle)
        fields = reader.fieldnames
        rows = list(reader)
    kept = [row for row in rows if start <= row["date"] <= end]
    _write(path, fields, kept)
    return len(rows), len(kept)


def _write(path, fields, rows):
    with open(path, "w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fields, quoting=csv.QUOTE_NONNUMERIC)
        writer.writeheader()
        writer.writerows(rows)


def main():
    if len(sys.argv) != 4:
        sys.exit(__doc__)
    feed_dir, start, end = sys.argv[1], sys.argv[2], sys.argv[3]
    if not (len(start) == 8 and len(end) == 8 and start <= end):
        sys.exit(f"bad window: {start}..{end} (expect YYYYMMDD, start <= end)")

    services = clip_calendar(os.path.join(feed_dir, "calendar.txt"), start, end)
    total, kept = filter_calendar_dates(os.path.join(feed_dir, "calendar_dates.txt"), start, end)
    print(f"trim-gtfs: clipped {services} services to {start}..{end}; "
          f"calendar_dates {total} -> {kept} rows")


if __name__ == "__main__":
    main()
