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
| `../.env.example` | Stack config — portal (`PORTAL_PORT`, `VALHALLA_URL`, registry overrides) **and** the Valhalla routing knobs used when `valhalla/.env` is absent |
| `Dockerfile` | Multi-stage portal image (Node 24.15.0 build → nginx runtime) |
| `nginx.conf` | Serves the SPA + registries, reverse-proxies `/valhalla/` |
| `docker-entrypoint.d/40-cosi-runtime-config.sh` | Startup hook: runtime config injection |
| `bootstrap-csl.sh` | One-command bring-up (CSL server or any Docker host) |

## Quick start (prod / staging — built image)

```bash
# from the repo root
cp .env.example .env                       # optional: set PORTAL_PORT, routing knobs
docker network create dokploy-network      # once (see note); bootstrap-csl.sh does it for you
docker compose up -d --build               # or: ./deploy/bootstrap-csl.sh
```

> The `portal` service joins the external `dokploy-network` (so Dokploy's Traefik
> can reach it). On Dokploy that network already exists; **off** Dokploy create it
> once — it's idempotent and sits empty harmlessly if you're not running Traefik.

Then open **http://localhost:8080/cosi/**. The **first** start also builds the
Valhalla tiles (slow, resource-heavy — see `../valhalla/Readme.md`); the portal
is up immediately, routing starts working once Valhalla is ready
(`docker compose logs -f valhalla`).

> No `.env` files are required to boot — every var has a sensible default
> (Hamburg extract, HVV transit on). The HVV GTFS feed is fetched automatically
> by the `gtfs-fetch` init container before the tile build; if its URL has
> expired the stack still comes up with car/bike/foot routing (see *Transit*
> below). `valhalla/.env`, if you create one, overrides the routing defaults.

## Deploy on Dokploy (git → click deploy)

Dokploy clones the repo and runs `docker compose up` — this stack is built for
that (self-contained, no host-side pre-steps):

1. **New → Compose**, point it at this repo, compose path `docker-compose.yml`.
2. **Environment** tab: paste the vars you want to override from `.env.example`
   (Dokploy writes them as the root `.env`, which also feeds the Valhalla
   service). At minimum consider `PORTAL_PORT`; set `OSM_EXTRACT_URL` /
   `BUILD_TRANSIT` here if you don't want the Hamburg+transit defaults.
3. **Deploy.** First build: the portal image (`npm` install + Vite build, heavy —
   see *Resource needs*) and Valhalla's first tile build run once.
4. **Domains** → add a domain → service `portal`, container port `80`, HTTPS on.
   The compose already attaches `portal` to `dokploy-network` and sets
   `traefik.docker.network=dokploy-network`, so Traefik can reach it. (Without
   that, a Compose app gets the route labels but no network → `404 page not
   found` and a self-signed cert — Dokploy issue #3200.) **Redeploy** after
   adding/changing a domain — labels only apply on redeploy.

> **Don't publish host port 8080 on Dokploy.** Dokploy's own Traefik already
> binds 8080; set `PORTAL_PORT` to a free port in the Environment tab (or rely on
> the domain and ignore the host publish) or the deploy fails with
> `Bind for 0.0.0.0:8080 failed: port is already allocated`.

Persistence: Valhalla tiles live in the named volume `valhalla_tiles`, so they
survive redeploys (no rebuild). `gtfs_feeds/` is re-fetched on a clean redeploy
(cheap) unless tiles are already cached, in which case Valhalla reuses them.

## Resource needs

| Phase | Needs |
|-------|-------|
| **Portal image build** | Node build is memory-hungry (full Masterportal + ~11 addons `npm install`, then Vite). Give the build host **≥ 4 GB RAM** (8 GB comfortable) or it can OOM. Prefer building in CI and pulling the image on small hosts (see *Building / publishing*). |
| **Valhalla tile build (first run)** | Hamburg extract: a few GB disk + ~2–4 GB RAM, minutes–tens of minutes. With `BUILD_TRANSIT=True`: **~6 GB RAM**. Full HVV / Germany extract: **many GB disk + 8–16 GB RAM**, can take hours — bump `HEALTHCHECK_START_PERIOD`. |
| **Steady state** | Valhalla serving tiles is light; the `valhalla_tiles` volume holds the built graph (size scales with the extract). |

## Transit (HVV GTFS)

`BUILD_TRANSIT=True` (default) makes the `gtfs-fetch` init container download +
prepare the HVV feed before the tile build. The feed **expires each schedule
period**: when transit stops building, update `HVV_GTFS_URL` (latest from the
[Transparenzportal](https://suche.transparenz.hamburg.de/?q=hvv+fahrplandaten+gtfs))
and redeploy with `force_rebuild`/`FORCE_REBUILD=True` for one run. A stale URL
is **fail-soft** — the stack comes up with car/bike/foot routing and logs a
warning (`docker compose logs gtfs-fetch`); it never blocks the deploy. Set
`BUILD_TRANSIT=False` for a deliberately transit-free (lighter) deployment.

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
