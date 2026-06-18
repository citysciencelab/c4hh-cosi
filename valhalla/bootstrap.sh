#!/usr/bin/env bash
# One-command bootstrap for the COSI Valhalla routing service.
#
#   ./bootstrap.sh
#
# Steps:
#   1. Create .env from .env.example on first run.
#   2. Download the HVV GTFS feed (unless BUILD_TRANSIT=False).
#   3. Pull the image and start Valhalla (first run downloads the OSM extract and
#      BUILDS the routing tiles — slow, RAM/CPU/disk heavy; see Readme.md).
#   4. Wait for the /status health endpoint to come up.
#
# Safe to re-run: existing tiles in the named volume are reused unless you set
# FORCE_REBUILD=True (see scripts/refresh.sh).
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

if [ ! -f .env ]; then
  echo "→ Creating .env from .env.example (edit it to change the OSM/GTFS source)"
  cp .env.example .env
fi
set -a; . ./.env; set +a

PORT="${VALHALLA_PORT:-8002}"

if [ "${BUILD_TRANSIT:-True}" = "True" ]; then
  ./scripts/fetch-gtfs.sh
else
  echo "→ BUILD_TRANSIT=False — skipping GTFS download (car/bike/foot only)"
fi

echo "→ Starting Valhalla (docker compose up -d) …"
docker compose up -d

echo "→ Waiting for Valhalla to serve on http://localhost:${PORT}/status"
echo "   (the initial tile build can take a long time; tail logs with:"
echo "    docker compose logs -f valhalla )"
until curl -fsS "http://localhost:${PORT}/status" >/dev/null 2>&1; do
  if ! docker compose ps --status running --quiet valhalla | grep -q .; then
    echo "✗ Valhalla container is not running. Check: docker compose logs valhalla" >&2
    exit 1
  fi
  printf '.'
  sleep 10
done

echo
echo "✓ Valhalla is up:"
curl -fsS "http://localhost:${PORT}/status"
echo
echo "  Isochrone endpoint: POST http://localhost:${PORT}/isochrone"
