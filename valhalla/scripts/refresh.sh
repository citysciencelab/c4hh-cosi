#!/usr/bin/env bash
# Refresh the routing data: re-download the latest GTFS feed and rebuild the
# Valhalla tiles from a fresh OSM extract.
#
# Use this when a new HVV schedule period is published (update HVV_GTFS_URL in
# .env first) or to pick up a newer Germany OSM extract. The build is heavy —
# see Readme.md for resource needs.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VALHALLA_DIR="$(dirname "$SCRIPT_DIR")"
cd "$VALHALLA_DIR"

if [ -f .env ]; then set -a; . ./.env; set +a; fi

if [ "${BUILD_TRANSIT:-True}" = "True" ]; then
  ./scripts/fetch-gtfs.sh
fi

echo "→ Rebuilding tiles from scratch (FORCE_REBUILD=True for this run) …"
FORCE_REBUILD=True docker compose up -d --force-recreate

echo "✓ Rebuild started. Follow progress with: docker compose logs -f valhalla"
echo "  Once done, set FORCE_REBUILD back to False (or rely on the .env default)"
echo "  so the next restart reuses the tiles instead of rebuilding."
