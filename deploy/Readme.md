# COSI deployment (full stack)

Reproducible, one-command deployment of the whole COSI stack — the **portal**
(Masterportal + COSI addon, built to a static SPA) plus the self-hosted
**Valhalla** routing service — that runs the same locally and on the CSL server
(BACKLOG §8).

```
                         ┌─────────────────────────────────────────┐
  browser  ──────────▶   │  portal (nginx)                         │
                         │   /cosi/          static SPA + registries│
                         │   /mastercode/    versioned JS/CSS       │
                         │   /valhalla/  ──▶  reverse-proxy ───────┐ │
                         └────────────────────────────────────────│─┘
                                                                   ▼
                         ┌─────────────────────────────────────────┐
                         │  valhalla  (routing, :8002)  — BACKLOG §2 │
                         └─────────────────────────────────────────┘

  WPS (population) + statistical / OAF data stay EXTERNAL at Hamburg (BACKLOG §7).
```

The portal calls routing **same-origin** as `/valhalla/...`; nginx proxies that to
the Valhalla container. No CORS, no mixed-content, and the routing URL is stable
regardless of where Valhalla actually runs.

## Files

| File | Purpose |
|------|---------|
| `../docker-compose.yml` | Root orchestration: `portal` + `valhalla` (via `include`) |
| `../.env.example` | Portal-stack config (`PORTAL_PORT`, `VALHALLA_URL`, registry overrides) |
| `Dockerfile` | Multi-stage portal image (Node 24.15.0 build → nginx runtime) |
| `nginx.conf` | Serves the SPA + registries, reverse-proxies `/valhalla/` |
| `docker-entrypoint.d/40-cosi-runtime-config.sh` | Startup hook: runtime config injection |
| `bootstrap-csl.sh` | One-command bring-up (CSL server or any Docker host) |

## Quick start (prod / staging — built image)

```bash
# from the repo root
cp .env.example .env                       # optional: set PORTAL_PORT etc.
cp valhalla/.env.example valhalla/.env     # optional: tune routing (BACKLOG §2)
docker compose up -d --build               # or: ./deploy/bootstrap-csl.sh
```

Then open **http://localhost:8080/cosi/**. The **first** start also builds the
Valhalla tiles (slow, resource-heavy — see `../valhalla/Readme.md`); the portal
is up immediately, routing starts working once Valhalla is ready
(`docker compose logs -f valhalla`).

> **Tiles volume note:** run via this stack, Valhalla uses the `cosi_valhalla_tiles`
> volume (Compose project `cosi`). Tiles you built earlier with the *standalone*
> `cd valhalla && docker compose up` live in a different volume, so the first
> full-stack start rebuilds them once.

## Dev vs prod

| | Dev | Prod / staging |
|---|---|---|
| Portal | Vite dev server — `cd masterportal && npm start`, https://localhost:9001/portal/cosi/ (Readme §3) | Built image behind nginx — `docker compose up`, http://localhost:8080/cosi/ |
| Rebuild on change | hot-reload | rebuild image (`docker compose build portal`) |
| Routing | local Valhalla on `http://localhost:8002` (rest-services.json) | same-origin `/valhalla/` proxy (injected at start) |

Dev stays on Vite for fast iteration; prod uses the immutable built image. The
two don't share state — different ports, different routing URL.

## Runtime config injection

One image, many environments — no rebuild to change endpoints. On container start
the hook patches the **served** config from env vars (all optional, sensible
defaults). Set them in the root `.env` / compose `environment:`:

| Env var | Default | Effect |
|---------|---------|--------|
| `VALHALLA_URL` | `/valhalla` | `rest-services.json` `valhalla` entry → this URL (same-origin proxy by default) |
| `LAYER_CONF` | *(keep build)* | `config.js` `layerConf` (services.json URL) |
| `REST_CONF` | *(keep build)* | `config.js` `restConf` (rest-services.json URL) |
| `STYLE_CONF` | *(keep build)* | `config.js` `styleConf` |

## Building / publishing the image

```bash
docker build -f deploy/Dockerfile -t cosi-portal:<tag> .   # context = repo root
```

The build is **heavy** (full layered npm install of Masterportal + COSI addon,
then a Vite production build). Suggested tagging: by Masterportal+COSI version,
e.g. `cosi-portal:mp3.23.0-cosi1.2.0`, plus `:latest`. If/when we host a fork
(BACKLOG §2.5), publish to GHCR (`ghcr.io/<org>/cosi-portal`) from CI so servers
pull a prebuilt image instead of building on the box. `ARG MASTERCODE_VERSION_FOLDER`
(default `3_23_0`) pins the `mastercode/<version>` asset folder for a deterministic,
git-independent build.

## TLS / public hostname

`bootstrap-csl.sh` brings up plain **HTTP** on `PORTAL_PORT`. For a public
hostname, terminate TLS in front of the `portal` service with a reverse proxy:

- **Caddy** (simplest — automatic Let's Encrypt): `reverse_proxy localhost:8080`.
- **Traefik** / **nginx + certbot**: proxy `cosi.example.org` → `portal:80`.

Keep the TLS proxy outside this compose (or add it as another service) so cert
storage and the public hostname are operator concerns, decoupled from the app.
