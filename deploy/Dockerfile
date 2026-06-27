# Multi-stage build for the self-hosted COSI portal (BACKLOG §8).
#
#   build stage  — Node 24.15.0, reproduces the layered install from BACKLOG §1
#                  (masterportal → addons --ignore-scripts → cosi) then runs the
#                  Vite production build of the `portal/cosi` portal.
#   runtime stage — nginx serving the static `dist/`, with a startup hook that
#                  injects runtime config (Valhalla URL, registry URLs) so one
#                  image works local vs CSL without a rebuild.
#
# Build context is the REPO ROOT (so we can COPY masterportal/); see .dockerignore.
#   docker build -f deploy/Dockerfile -t cosi-portal .
# or just `docker compose build portal` from the repo root.

# ---------------------------------------------------------------------------
# Stage 1 — build the portal
# ---------------------------------------------------------------------------
FROM node:24.15.0-bookworm AS build

# The Vite build derives the mastercode/<version> folder name from git; with no
# .git in the build context it would fall back to a timestamp. Pin it instead so
# the build is deterministic and index.html ↔ asset folder always agree.
ARG MASTERCODE_VERSION_FOLDER=3_23_0
ENV MASTERCODE_VERSION_FOLDER=${MASTERCODE_VERSION_FOLDER}

WORKDIR /app
# Source tree only — node_modules/dist/.git are excluded via .dockerignore.
COPY masterportal/ ./masterportal/

# Layered install (mirrors Readme "Install dependencies (layered)" / BACKLOG §1).
# engine-strict in .npmrc is satisfied because the base image is the pinned 24.15.0.
WORKDIR /app/masterportal
RUN npm install --no-audit --no-fund

# Addons: install top-level deps but skip the root postinstall/prepare (the
# `prepare: husky install` needs a .git, which isn't in the build context).
WORKDIR /app/masterportal/addons
RUN npm install --ignore-scripts --no-audit --no-fund

# The production build bundles EVERY addon registered in addonsConf.json, so each
# addon that has its own node_modules imports must have its deps installed — not
# just cosi (e.g. vpiDashboard imports vue-slider-component). This list mirrors
# the addons `postinstall` script exactly; none of these sub-packages have a
# prepare/husky script, so they install cleanly without git.
RUN set -eu; \
    for d in sdpDownload vcOblique valuationPrint waterRiskCheck simulationTool \
             shared/js/mapfishUtils vpiDashboard gfiThemes/combinedGfi cosi \
             storyTellingTool/storyCreator storyTellingTool/storyManager; do \
        echo "==> npm install addons/$d"; \
        (cd "$d" && npm install --no-audit --no-fund); \
    done

# Production build of the portals in portal/ (incl. portal/cosi). The official
# build (`npm run build`) removes the intermediate dist/portal afterwards — do
# the same. Result: dist/cosi/ (portal + registries) + dist/mastercode/ (assets).
WORKDIR /app/masterportal
RUN node node_modules/.bin/vite build --config devtools/vite.config.js --mode production \
    && rm -rf dist/portal

# ---------------------------------------------------------------------------
# Stage 2 — nginx runtime
# ---------------------------------------------------------------------------
FROM nginx:1.27-alpine AS runtime

# jq is used by the startup hook to patch rest-services.json.
RUN apk add --no-cache jq

# Static build output → web root. Portal lives at /cosi/, assets at /mastercode/.
COPY --from=build /app/masterportal/dist/ /usr/share/nginx/html/

COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
# nginx:alpine runs every /docker-entrypoint.d/*.sh before starting nginx.
COPY deploy/docker-entrypoint.d/40-cosi-runtime-config.sh /docker-entrypoint.d/40-cosi-runtime-config.sh
RUN chmod +x /docker-entrypoint.d/40-cosi-runtime-config.sh

EXPOSE 80
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget -qO- http://localhost/cosi/config.js >/dev/null 2>&1 || exit 1
