# Valhalla routing service (self-hosted)

Self-hosted [Valhalla](https://github.com/valhalla/valhalla) routing engine that
replaces the Hamburg/BKG **OpenRouteService** (ORS) used by COSI's
`AccessibilityAnalysis` tool for isochrones. Runs locally via Docker Compose and
deploys the same way on the CSL server.

> The COSI **code** still has to be adapted from the ORS isochrone API to
> Valhalla's — that is BACKLOG §3, a separate task. This directory only stands up
> the service.

## Quick start

```bash
cd valhalla
./bootstrap.sh
```

This copies `.env.example` → `.env`, downloads the HVV GTFS feed, pulls the
image, and starts Valhalla. The **first** run downloads the OSM extract and
builds the routing tiles — this is slow and resource-heavy (see below). Tiles are
stored in the `valhalla_tiles` named volume, so later restarts reuse them.

When it's up:

```bash
curl http://localhost:8002/status
```

Then point COSI's `rest-services.json` `valhalla` entry at
`http://localhost:8002` (BACKLOG §3/§6).

## What gets built

- **Driving / cycling / walking** graph from an OSM extract (Geofabrik). Default
  is **all of Germany**; for local dev you can switch `OSM_EXTRACT_URL` in `.env`
  to the much lighter **Hamburg** extract.
- **Public transport** graph from the **HVV GTFS** feed (`build_transit=True`),
  enabling multimodal routing. `scripts/fetch-gtfs.sh` downloads and unzips the
  feed into `gtfs_feeds/hvv/`. Admin and timezone databases are built too
  (`build_admins`/`build_time_zones`), which transit/time-dependent routing needs.

Set `BUILD_TRANSIT=False` in `.env` for a car/bike/foot-only graph (much faster,
no GTFS download).

## Configuration

All settings live in `.env` (see `.env.example` for the full list and comments):

| Variable | Default | Purpose |
|----------|---------|---------|
| `OSM_EXTRACT_URL` | Germany (Geofabrik) | OSM extract to build from |
| `HVV_GTFS_URL` | HVV GTFS (May–Dec 2025) | Public-transport feed |
| `BUILD_TRANSIT` | `True` | Build the GTFS transit graph |
| `VALHALLA_PORT` | `8002` | Host port |
| `SERVER_THREADS` | `4` | Request worker threads |
| `BUILD_ELEVATION` | `False` | Elevation-aware bike/foot costing |
| `FORCE_REBUILD` | `False` | Discard tiles and rebuild |

## Operations

- **Logs / build progress:** `docker compose logs -f valhalla`
- **Stop / start:** `docker compose down` / `docker compose up -d`
  (tiles survive in the named volume; restart skips the build)
- **Refresh data** (new HVV schedule period or newer OSM extract): update
  `HVV_GTFS_URL` in `.env` if needed, then `./scripts/refresh.sh`
  (rebuilds tiles once with `FORCE_REBUILD=True`).
- **Wipe everything:** `docker compose down -v` (removes the tile volume too —
  the next start rebuilds from scratch).

## Resource needs (tile build)

Building tiles is **RAM/CPU/disk heavy**, especially for all of Germany. Rough
guidance for the CSL server / a capable dev machine:

| Extract | Download | Peak RAM | Disk (tiles) | Build time* |
|---------|----------|----------|--------------|-------------|
| Hamburg | ~70 MB   | ~2–4 GB  | ~1–2 GB      | a few min   |
| Germany | ~4 GB    | ~16+ GB  | ~30–40 GB    | ~30–90 min  |

\* Very hardware-dependent. Transit + elevation add download, time and disk on
top. Give Docker enough memory/disk headroom before a Germany build; the build
runs **inside** the container, so the container — not just the host — must have
access to that RAM.

The build happens on first `up` (or after `FORCE_REBUILD`); the service serves
tiles afterwards. During the build, `/status` is unavailable and the container's
healthcheck shows `unhealthy` until serving begins — this is expected (the
healthcheck `start_period` is set generously in `docker-compose.yml`).

## Isochrone capabilities (BACKLOG §2 decision)

Valhalla's [`/isochrone`](https://valhalla.github.io/valhalla/api/isochrone/api-reference/)
endpoint supports contours by **`time`** (minutes) **and** by **`distance`**
(km), in the same request, with no extra build configuration.

- **Time-based** isochrones are the requirement and what COSI's
  `AccessibilityAnalysis` uses today (it passes ranges in seconds → convert to
  minutes for Valhalla).
- **Distance-based** isochrones are therefore **available for free** on the same
  service if we decide we want them — that decision belongs to the §3 code change
  (and is tracked as an open question in BACKLOG §8); no change is needed here.

## Deploying on the CSL server

Same flow: install Docker + Compose, clone the repo, `cd valhalla`, edit `.env`
(at minimum confirm `OSM_EXTRACT_URL` and a current `HVV_GTFS_URL`), then
`./bootstrap.sh`. The Compose service uses `restart: unless-stopped`, so it comes
back up after a reboot and reuses the tile volume. Ensure the box has the RAM and
disk from the table above before the first build.
