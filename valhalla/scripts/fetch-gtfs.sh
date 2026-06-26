#!/usr/bin/env bash
# Download the HVV GTFS timetable feed and unzip it into gtfs_feeds/hvv/ so
# Valhalla can build the public-transport graph from it.
#
# Valhalla expects each feed as an *unzipped* subfolder of the gtfs dir
# (e.g. gtfs_feeds/hvv/stops.txt, …) — a bare .zip is not picked up.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VALHALLA_DIR="$(dirname "$SCRIPT_DIR")"
cd "$VALHALLA_DIR"

# Load .env (for HVV_GTFS_URL) if present.
if [ -f .env ]; then
  set -a; . ./.env; set +a
fi

: "${HVV_GTFS_URL:?HVV_GTFS_URL is not set — copy .env.example to .env or export it}"

FEED_NAME="${1:-hvv}"
DEST="gtfs_feeds/${FEED_NAME}"
TMP_ZIP="$(mktemp --suffix=.zip)"
trap 'rm -f "$TMP_ZIP"' EXIT

echo "→ Downloading GTFS feed '${FEED_NAME}' from:"
echo "    ${HVV_GTFS_URL}"
curl -fSL --retry 3 --retry-delay 5 -o "$TMP_ZIP" "$HVV_GTFS_URL"

echo "→ Unzipping into ${DEST}/"
rm -rf "$DEST"
mkdir -p "$DEST"
unzip -o -q "$TMP_ZIP" -d "$DEST"

# Some feeds zip their files inside a single top-level folder; flatten it so the
# .txt files sit directly in $DEST (Valhalla looks for them there).
inner="$(find "$DEST" -mindepth 1 -maxdepth 1 -type d)"
if [ -n "$inner" ] && [ ! -f "$DEST/stops.txt" ] && [ -f "$inner/stops.txt" ]; then
  echo "→ Flattening nested folder $(basename "$inner")/"
  mv "$inner"/* "$DEST"/
  rmdir "$inner"
fi

if [ ! -f "$DEST/stops.txt" ]; then
  echo "✗ Expected GTFS files (stops.txt) not found in ${DEST}/ — check the URL." >&2
  exit 1
fi

# ── Prepare the feed for Valhalla (see scripts/trim-gtfs.py / filter-gtfs-poly.py) ──
# Two reasons the raw HVV feed must be reduced before Valhalla can build it:
#  1. It spans ~9 months of service (2.5M stop_times); the transit+enhance step
#     balloons and is very slow. We clip the calendar to a short current window.
#  2. It covers the whole metropolitan region, but our OSM extract is Hamburg
#     only; stops outside the road graph make Valhalla ABORT the build
#     (std::bad_array_new_length / "Could not find connection point"). We drop
#     stops outside the extract's polygon.

# 1. Clip the service calendar to [today, today+GTFS_TRIM_DAYS] (0 disables).
TRIM_DAYS="${GTFS_TRIM_DAYS:-14}"
if [ "$TRIM_DAYS" != "0" ]; then
  START="$(date +%Y%m%d)"
  END="$(date -d "+${TRIM_DAYS} days" +%Y%m%d)"
  python3 "$SCRIPT_DIR/trim-gtfs.py" "$DEST" "$START" "$END"
fi

# 2. Spatially filter stops to the OSM extract boundary polygon (empty disables).
POLY="${GTFS_BOUNDARY_POLY:-hamburg.poly}"
if [ -n "$POLY" ]; then
  case "$POLY" in /*) POLY_PATH="$POLY";; *) POLY_PATH="$VALHALLA_DIR/$POLY";; esac
  if [ ! -f "$POLY_PATH" ]; then
    echo "✗ Boundary polygon '$POLY_PATH' not found. Set GTFS_BOUNDARY_POLY= to skip" >&2
    echo "  spatial filtering, or provide the .poly matching your OSM extract." >&2
    exit 1
  fi
  python3 "$SCRIPT_DIR/filter-gtfs-poly.py" "$DEST" "$POLY_PATH"
fi

echo "✓ GTFS feed ready in ${DEST}/ ($(find "$DEST" -name '*.txt' | wc -l | tr -d ' ') text files)"
