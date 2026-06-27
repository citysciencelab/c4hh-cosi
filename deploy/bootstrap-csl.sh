#!/usr/bin/env bash
# One-command bring-up of the full COSI stack (portal + Valhalla) on the CSL
# server — or any Docker host (BACKLOG §8).
#
# What it does:
#   1. Sanity-checks Docker + Compose.
#   2. Ensures the config files exist (root .env, valhalla/.env) from the examples.
#   3. Builds + starts the stack (`docker compose up -d --build`).
#   4. Waits for the portal to answer.
#
# The FIRST run also triggers Valhalla's tile build, which is slow and
# resource-heavy (RAM/disk — see valhalla/Readme.md). For full HVV coverage edit
# valhalla/.env BEFORE the first start (OSM_EXTRACT_URL + GTFS_BOUNDARY_POLY=).
#
# TLS: this script brings up plain HTTP on PORTAL_PORT. For a public hostname put
# a TLS-terminating reverse proxy (e.g. Caddy / Traefik / nginx + Let's Encrypt)
# in front of it — see deploy/Readme.md.
set -euo pipefail

cd "$(dirname "$0")/.."   # repo root
ROOT="$PWD"

echo "==> COSI full-stack bootstrap (repo: $ROOT)"

# --- 1. prerequisites ------------------------------------------------------
if ! command -v docker >/dev/null 2>&1; then
    echo "ERROR: docker not found. Install Docker Engine + Compose plugin first." >&2
    exit 1
fi
if ! docker compose version >/dev/null 2>&1; then
    echo "ERROR: 'docker compose' (v2) not available." >&2
    exit 1
fi

# --- 2. config files -------------------------------------------------------
if [ ! -f "$ROOT/.env" ]; then
    cp "$ROOT/.env.example" "$ROOT/.env"
    echo "    created .env from .env.example"
fi
if [ ! -f "$ROOT/valhalla/.env" ]; then
    cp "$ROOT/valhalla/.env.example" "$ROOT/valhalla/.env"
    echo "    created valhalla/.env from valhalla/.env.example"
    echo "    NOTE: edit valhalla/.env now if you want full HVV coverage before the"
    echo "          first (one-time) tile build."
fi

# Pick up PORTAL_PORT for the readiness check.
PORTAL_PORT="$(grep -E '^PORTAL_PORT=' "$ROOT/.env" | cut -d= -f2 || true)"
PORTAL_PORT="${PORTAL_PORT:-8080}"

# --- 3. build + start ------------------------------------------------------
echo "==> Building and starting the stack (first run builds Valhalla tiles — slow)"
docker compose up -d --build

# --- 4. wait for the portal ------------------------------------------------
echo "==> Waiting for the portal on http://localhost:${PORTAL_PORT}/cosi/ ..."
for _ in $(seq 1 60); do
    if curl -fsS "http://localhost:${PORTAL_PORT}/cosi/config.js" >/dev/null 2>&1; then
        echo "==> Portal is up: http://localhost:${PORTAL_PORT}/cosi/"
        echo "    (Routing via /valhalla/ becomes available once Valhalla finishes"
        echo "     building tiles — watch: docker compose logs -f valhalla)"
        exit 0
    fi
    sleep 2
done

echo "WARNING: portal did not answer in time; check 'docker compose logs portal'." >&2
exit 1
