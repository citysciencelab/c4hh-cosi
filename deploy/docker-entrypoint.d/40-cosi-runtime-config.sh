#!/bin/sh
# Runtime config injection for the COSI portal (BACKLOG §8).
#
# Runs once on container start (nginx:alpine executes /docker-entrypoint.d/*.sh
# before launching nginx). It patches the SERVED config so a single built image
# works in different environments without a rebuild. Everything has a sensible
# default, so the container also works with no env vars set.
#
#   VALHALLA_URL  base url the portal uses to reach Valhalla   (default: /valhalla,
#                 i.e. the same-origin nginx proxy in this stack)
#   LAYER_CONF    override config.js layerConf (services.json)   (default: keep build)
#   REST_CONF     override config.js restConf (rest-services.json)(default: keep build)
#   STYLE_CONF    override config.js styleConf                    (default: keep build)
#
# Idempotent: each run rewrites from the current value, so restarts are safe.
set -eu

PORTAL_DIR=/usr/share/nginx/html/cosi
VALHALLA_URL="${VALHALLA_URL:-/valhalla}"

log() { echo "[cosi-config] $*"; }

# --- rest-services.json: point the "valhalla" entry at VALHALLA_URL --------
REST="$PORTAL_DIR/rest-services.json"
if [ -f "$REST" ]; then
    tmp="$(mktemp)"
    if jq --arg url "$VALHALLA_URL" \
        '(.[] | select(.id == "valhalla") | .url) = $url' "$REST" > "$tmp"; then
        mv "$tmp" "$REST"
        # mktemp files are 0600/root — make it world-readable so the nginx
        # worker (user `nginx`) can serve it (otherwise 403).
        chmod 644 "$REST"
        log "rest-services.json: valhalla url -> $VALHALLA_URL"
    else
        rm -f "$tmp"
        log "WARNING: could not patch $REST (left unchanged)"
    fi
fi

# --- config.js: optional registry / style overrides -----------------------
CONFIG="$PORTAL_DIR/config.js"
if [ -f "$CONFIG" ]; then
    if [ -n "${LAYER_CONF:-}" ]; then
        sed -i "s#layerConf: \"[^\"]*\"#layerConf: \"${LAYER_CONF}\"#" "$CONFIG"
        log "config.js: layerConf -> $LAYER_CONF"
    fi
    if [ -n "${REST_CONF:-}" ]; then
        sed -i "s#restConf: \"[^\"]*\"#restConf: \"${REST_CONF}\"#" "$CONFIG"
        log "config.js: restConf -> $REST_CONF"
    fi
    if [ -n "${STYLE_CONF:-}" ]; then
        sed -i "s#styleConf: \"[^\"]*\"#styleConf: \"${STYLE_CONF}\"#" "$CONFIG"
        log "config.js: styleConf -> $STYLE_CONF"
    fi
fi

log "runtime config injection done"
