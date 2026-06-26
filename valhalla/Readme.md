# Valhalla routing service (self-hosted)

Self-hosted [Valhalla](https://github.com/valhalla/valhalla) routing engine that
replaces the Hamburg/BKG **OpenRouteService** (ORS) used by COSI's
`AccessibilityAnalysis` tool for isochrones. Runs locally via Docker Compose and
deploys the same way on the CSL server.

> The COSI code is adapted to Valhalla's isochrone API (BACKLOG §3, done):
> `AccessibilityAnalysis` dispatches to Valhalla when `isochroneBackend: "valhalla"`
> is set in the portal config. The car/bike/foot profiles plus a **public-transport**
> profile (Valhalla `multimodal`, built from the HVV GTFS feed below) are wired in.

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
  is the light **Hamburg** extract; switch `OSM_EXTRACT_URL` in `.env` to a
  regional/Germany extract for full coverage (heavier — see the resource table).
- **Public transport** graph from the **HVV GTFS** feed (`build_transit=True`),
  enabling multimodal routing. `scripts/fetch-gtfs.sh` downloads, unzips, and
  **prepares** the feed (admin/timezone DBs are built too, which transit needs).

  The raw HVV feed can't be built as-is, so `fetch-gtfs.sh` runs two steps:
  - `scripts/trim-gtfs.py` clips the ~9-month service calendar to a current
    window (`GTFS_TRIM_DAYS`, default 14) — the full span makes the build huge.
  - `scripts/filter-gtfs-poly.py` drops stops outside the OSM extract's polygon
    (`GTFS_BOUNDARY_POLY=hamburg.poly`). The HVV feed spans the whole region; a
    stop with no road in the extract makes Valhalla **abort** the build
    (`std::bad_array_new_length` / "Could not find connection point for in/egress").
    Point-in-polygon filtering against the extract's Geofabrik `.poly` guarantees
    every kept stop connects. **With the Hamburg extract, coverage is therefore
    Hamburg-city only.**

### Full HVV coverage (no Hamburg cropping)

Hamburg is a metropolitan area tightly interconnected with its hinterland, so for
the **complete HVV network** (suburban S-Bahn / regional rail to Pinneberg,
Norderstedt, Stade, Lübeck, …) the graph must span the whole catchment, not just
the city. In `.env`, do **both** (one without the other won't work):

1. Extend `OSM_EXTRACT_URL` to the catchment — either the requested states
   (Hamburg, Schleswig-Holstein, Mecklenburg-Vorpommern, Niedersachsen,
   Brandenburg, Sachsen-Anhalt, Berlin, Bremen, Hessen — space-separated Geofabrik
   URLs, merged into one graph) or simply `germany-latest.osm.pbf`. Both are
   spelled out in `.env.example`.
2. Set `GTFS_BOUNDARY_POLY=` (empty) so **no** stops are clipped — every HVV stop
   (~17.6k) now has a road to connect to. `GTFS_TRIM_DAYS` still applies (the
   calendar trim is independent and keeps the build tractable — more important at
   this scale, not less).

This is a **heavy, server-side build** (many GB download + lots of RAM/disk/time —
see the resource table). Run it on the CSL server, not a laptop.

Set `BUILD_TRANSIT=False` in `.env` for a car/bike/foot-only graph (faster, no
GTFS download/prep).

## Configuration

All settings live in `.env` (see `.env.example` for the full list and comments):

| Variable | Default | Purpose |
|----------|---------|---------|
| `OSM_EXTRACT_URL` | Germany (Geofabrik) | OSM extract to build from |
| `HVV_GTFS_URL` | HVV GTFS (Apr–Dec 2026) | Public-transport feed |
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
| HVV catchment states / Germany | ~4 GB | ~16+ GB | ~30–40 GB | ~30–90 min |

\* Very hardware-dependent. **Transit makes this heavier**: the full HVV feed
(~17.6k stops, no polygon clipping) needs noticeably more RAM than the
Hamburg-only build (the laptop's 8 GB Docker VM was already tight for
Hamburg-city transit — full coverage needs the server). Elevation adds download,
time and disk too. Give Docker enough memory/disk headroom before a multi-state /
Germany build; the build runs **inside** the container, so the container — not
just the host — must have access to that RAM.

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
  (and is tracked as an open question in BACKLOG §9); no change is needed here.

## Deploying on the CSL server

Same flow: install Docker + Compose, clone the repo, `cd valhalla`, edit `.env`
(at minimum confirm `OSM_EXTRACT_URL` and a current `HVV_GTFS_URL`), then
`./bootstrap.sh`. The Compose service uses `restart: unless-stopped`, so it comes
back up after a reboot and reuses the tile volume. Ensure the box has the RAM and
disk from the table above before the first build.
