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

echo "✓ GTFS feed ready in ${DEST}/ ($(find "$DEST" -name '*.txt' | wc -l | tr -d ' ') text files)"
