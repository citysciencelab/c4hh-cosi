# COSI Self-Hosting Backlog

Goal: deploy our own version of **COSI** (Cockpit Städtische Infrastrukturen) as a genuine
open-source project, independent of the staging/production instances administered by the
Hamburg agency for geodata (LGV), whose access ends as the research project at the
CityScienceLab winds down.

This document is the working plan. It records what was discovered about the architecture,
what has to change, and the concrete tasks — so we can resume without re-investigating.

Status legend: `[ ]` todo · `[~]` in progress · `[x]` done · `[?]` needs decision/input

---

## 0. Architecture recap (so we don't re-derive it)

- Repo layout:
  - `masterportal/` — upstream **Masterportal** framework, **v3.23.0**
    (git remote: `bitbucket.org/geowerkstatt-hamburg/masterportal.git`).
  - `masterportal/addons/addons/` — separate nested git repo of LGV addons
    (`bitbucket.org/geowerkstatt-hamburg/addons.git`).
  - `masterportal/addons/addons/cosi/` — the COSI addon, **version 1.2.0**. It is *not*
    one tool but ~18 sub-tools (DistrictSelector, AccessibilityAnalysis, Dashboard,
    ChartGenerator, FeaturesList, ColorCodeMap, AreaSelector, ReportingTool, etc.).
- Addon registration: each sub-tool is registered in
  `masterportal/addons/addons/addonsConf.json` (e.g. `accessibilityAnalysis` →
  `cosi/AccessibilityAnalysis`, `districtSelector` → `cosi/DistrictSelector`, ...).
- **The COSI portalconfig does not exist in this repo.** The portals under
  `masterportal/portal/` (`master`, `auto`, `basic`) are the *stock Masterportal examples* —
  none load any COSI tool (see `portal/master/config.js` `addons: [...]`). The real COSI
  portalconfig lived in a separate `portalconfigs` repo administered by the agency
  (still referenced in `masterportal/package.json` scripts: `... && cd portalconfigs && ...`).
  **We must author the COSI portalconfig ourselves.**
- A portal is configured by two files:
  - `config.js` — build/runtime config: `addons` array (which addons to load),
    `layerConf` (services.json URL), `restConf` (rest-services.json URL),
    `styleConf`, projections, etc.
  - `config.json` — UI config: menu structure + per-tool config blocks
    (this is where DistrictSelector `districtLevels`, AccessibilityAnalysis params, etc. live).
- External dependencies, all currently pointing at Hamburg infrastructure
  (from `portal/master/config.js`) — **all reachable publicly today (HTTP 200), but
  access may change**:
  - `layerConf` = `https://geodienste.hamburg.de/services-internet.json`
  - `restConf`  = `https://geodienste.hamburg.de/lgv-config/rest-services-internet.json`
  - `styleConf` = `https://geodienste.hamburg.de/lgv-config/style_v3.json`
- Hidden service dependencies inside COSI:
  - **Routing/Isochrones** — OpenRouteService (ORS). `AccessibilityAnalysis` resolves
    `baseUrl = restServiceById("bkg_ors").url + "/v2/"`
    (`AccessibilityAnalysis.vue:409`), fallback service `csl_ors`
    (`store/stateAccessibilityAnalysis.js:58-59`). → **migrate to self-hosted Valhalla**.
  - **WPS population** — `wpsServiceId: "1001"`, process `einwohner_ermitteln.fmw`
    (`stateAccessibilityAnalysis.js:60-61`), counts residents inside an isochrone.
    Also referenced by DistrictSelector. **Decision: keep as-is — believed to be a public
    Hamburg WPS.** Verify; if it dies, the "residents within isochrone" feature is a
    nice-to-have we can disable.
  - **Statistical-data WFS** — DistrictSelector `districtLevels[].stats.layerIds` point at
    Hamburg UDP regionalstatistik WFS layers. **Decision: stats stay available over WFS**
    (and Hamburg's UDP is migrating WFS → **OGC API Features** over the next years; we
    should plan for that). Stats likely need a **name mapping** between district geometry
    names and statistical-data attribute names (see `districtNamesMap` and
    `stats.keyOfAttrName` in the DistrictSelector config).

---

## 1. Local environment / Node (low risk)

Context: `.npmrc` has `engine-strict=true`. Engines (root + addons `package.json`):
`node >=22.19.0 <23 || >=24 <25`, `npm >=10.9.3 <12`. CI image: `node:24.15.0`.
Current local: `node v24.11.0`, `npm 11.6.1` — **both already satisfy the range**, so the
earlier "node versions not correct" pain was probably a different/older Node selected at the
time. `node_modules` are not installed anywhere yet.

- [x] Add a Node pin so the env is reproducible: created `.nvmrc` (value `24.15.0`, matching CI)
      at `masterportal/` **and** repo root; `nvm use` documented in `Readme.md`.
      **Correction:** local v24.11.0/npm 11.6.1 do *not* satisfy — under `engine-strict` the
      transitive dep `@masterportal/masterportalapi@2.62.0` needs `node ^24.11.1`/`npm ^11.6.2`,
      so install fails `EBADENGINE` until on 24.15.0 (npm 11.12.1). This was the real "node" pain.
- [x] Install in the correct order:
      1. `cd masterportal && npm install` (839 pkgs, clean).
      2. `cd masterportal/addons && npm install` — **addons are at `addons/`, not `addons/addons/`.**
         Its `postinstall` aborted at `cd shared/js/mapfishUtils` because this partial checkout
         had flattened that dir to `mapfishUtils/` — **now fixed in the addons fork** (§2.5:
         restored to `shared/js/mapfishUtils/`, matching upstream + all the imports that use it).
         We still install with the lighter `npm install --ignore-scripts` then `cd cosi &&
         npm install` (~200 pkgs) to skip building addons we don't use. cosi v1.2.0 installs clean.
- [x] Sanity boot the stock example portal: `cd masterportal && npm start`
      (runs `vite`; `prestart` generates a dev cert). **Verified:** serves on
      `https://localhost:9001/` (HTTP 200), Vite logs the COSI tools in `provided addons:`.
- [x] Document the exact working Node/npm versions and steps in the root `Readme.md`. **Done.**

---

## 2. Self-host Valhalla routing service

Replace ORS with our own Valhalla, runnable locally **and** auto-deployable on the CSL server
(docker-compose + scripts, automatic OSM download + tile building).

- [x] Create `valhalla/` with `docker-compose.yml` using the community Valhalla image
      (`ghcr.io/gis-ops/docker-valhalla/valhalla`, overridable via `VALHALLA_IMAGE`).
      Config is `.env`-driven (`valhalla/.env.example`); `docker compose config` validates.
- [x] Configure automatic OSM extract download (Germany) from Geofabrik (`OSM_EXTRACT_URL`,
      Hamburg extract documented as the lighter local option) and **automatic tile building**
      on first `up`. Tiles persist in the named volume `valhalla_tiles` (restarts skip the
      build); `scripts/refresh.sh` forces a rebuild when the extract/GTFS changes.
- [x] Download HVV GTFS data and build the public-transport mode: `scripts/fetch-gtfs.sh`
      pulls + unzips the HVV feed (`HVV_GTFS_URL`, latest from the Hamburg Transparenzportal)
      into `gtfs_feeds/hvv/`; compose builds it with `build_transit`/`build_admins`/`build_time_zones`.
- [x] Expose Valhalla on a stable URL (local: `http://localhost:8002`, `VALHALLA_PORT`).
      Compose healthcheck polls `/status` (generous `start_period` covers the long initial build).
- [x] One-command bootstrap: `valhalla/bootstrap.sh` (creates `.env`, fetches GTFS, pulls,
      starts, waits for `/status`). `valhalla/Readme.md` documents resource needs (RAM/CPU/disk
      table: Hamburg vs Germany), refresh flow, and CSL-server deployment.
- [x] Isochrone capabilities decided (see `valhalla/Readme.md`): **time-based** is the
      requirement and is what AccessibilityAnalysis uses; Valhalla `/isochrone` also supports
      **distance-based** contours on the same service for free — usage decision deferred to
      the §3 code change (open question in §9). No service-side change needed.

---

## 2.5 Track the agency's COSI as a fork (foundation for §3/§8)

We will keep developing on top of COSI while the agency keeps shipping new versions. To pull
their updates **without redoing our changes** (Valhalla migration etc.), our edits must live as a
small, additive, *tracked* diff on top of a pinned upstream base — so an upstream bump is a
`rebase`, not a rewrite. Before this, `masterportal/addons/` was an untracked, gitignored partial
checkout with no git association at all, which made automated updates impossible.

- [x] Make `masterportal/addons/` its **own standalone git repo** (a fork). It stays invisible to
      both parents (`masterportal/.gitignore` ignores `addons/*`; root ignores `/masterportal/`),
      so it carries its own history without interfering. `upstream` remote =
      `bitbucket.org/geowerkstatt-hamburg/addons.git`; our branch = **`cosi-selfhost`**.
- [x] **Pin the base:** `cosi-selfhost` is rooted at upstream `dev` commit **`f148b81e`**
      (2026-06-16; = v3.23.0 + unreleased work incl. `planParken`), tagged **`upstream-base`**.
      All upstream tags fetched (through `v3.23.0`).
- [x] **Corrected one partial-checkout artifact** so the base is pristine: `mapfishUtils/` was
      flattened locally; restored to upstream's `shared/js/mapfishUtils/` (the path used by
      `cosi/ReportingTool`, `valuationPrint`, `waterRiskCheck` imports and the addons
      `postinstall`). Working tree now matches `f148b81e` byte-for-byte → zero standing diff,
      so future rebases only touch lines we actually change. This also resolved the §1 breakage.
- [ ] **Create our hosted fork** (`origin`): make a fork on GitHub/Bitbucket, then
      `git remote add origin <url> && git push -u origin cosi-selfhost --tags`. (Outward-facing —
      do when ready to publish/back up.)
- [ ] **Automate the update** (the "update without redoing Valhalla" goal): a scheduled job that
      `git fetch upstream --tags`, attempts the rebase onto the newest tag, runs the
      AccessibilityAnalysis tests, and opens a PR if it applies cleanly (flags us only when our
      seam genuinely collides). See update procedure in the root `Readme.md`.
- [ ] **Consider upstreaming** the config-selectable Valhalla backend to the agency — if accepted,
      zero maintenance for us. Raise alongside the portalconfig request.

Update procedure (manual, today): `cd masterportal/addons && git fetch upstream --tags &&
git rebase <new-tag>`, resolve only true collisions, then refresh deps.

---

## 3. Adapt AccessibilityAnalysis to Valhalla (code change)

This is a real rewrite, not a URL swap — ORS and Valhalla isochrone APIs differ.
**Do this on the `cosi-selfhost` branch as additive, isolated changes (§2.5):** the import chain
is `actionsAccessibilityAnalysis.js → createIsochrones.js → requestIsochrones.js` (single default
export — the one chokepoint). Add a new Valhalla request module + a thin config-driven dispatcher
in `requestIsochrones.js`; normalize Valhalla's response inside it so `createIsochrones.js`,
`styleIsochroneFeatures.js`, and the `.vue` stay untouched. That keeps upstream rebases clean.

Files:
- `cosi/AccessibilityAnalysis/utils/requestIsochrones.js` — builds/sends the request.
- `cosi/AccessibilityAnalysis/utils/createIsochrones.js` — orchestrates ranges/chunking
  (ranges in **seconds** for time; chunks of 5; reverses features for render order).
- `cosi/AccessibilityAnalysis/components/AccessibilityAnalysis.vue:409` — builds `baseUrl`
  as `restServiceById(serviceId).url + "/v2/"` (the `/v2/` is ORS-specific).
- `cosi/AccessibilityAnalysis/store/stateAccessibilityAnalysis.js` —
  `serviceId: "bkg_ors"`, `fallbackServiceId: "csl_ors"`, `transportType: "driving-car"`,
  profiles `driving-car|cycling-regular|foot-walking|wheelchair`.

API differences to handle:
- Endpoint: ORS `POST {base}/v2/isochrones/{profile}/geojson` vs Valhalla `POST {base}/isochrone`.
- Body: ORS `{locations:[[lon,lat],...], range_type, range:[secs...]}` (multi-location,
  up to 5) vs Valhalla `{locations:[{lat,lon}], costing, contours:[{time:<min>}|{distance:<km>}],
  polygons:true, denoise, generalize}` — **Valhalla isochrone takes a single location per call**,
  so the existing chunk-of-5 batching must become one-request-per-coordinate (mind performance
  + the existing `batchSize`/`splitIntoChunks` logic).
- Units: ORS time range in **seconds**; Valhalla `time` in **minutes** (and distance in km).
- Profile mapping: `driving-car→auto`, `cycling-regular→bicycle`, `foot-walking→pedestrian`,
  `wheelchair→pedestrian` (+ wheelchair options) — confirm against our Valhalla config.
- Auth: remove the hardcoded ORS API key path
  (`requestIsochrones.js:31-33`, key `5b3ce359...`) — Valhalla (self-hosted) needs none.
- Response: both return GeoJSON FeatureCollections but property shapes differ
  (`value`/`contour` metadata). Normalize so downstream
  (`styleIsochroneFeatures.js`, feature `value`/`mode`/`unit` props, the 3-step
  `range/3, range*2/3, range` rendering) keeps working.
- [ ] Decide implementation shape: a Valhalla-specific request module selected by service
      type, vs. rewriting `requestIsochrones.js` in place. Prefer keeping it swappable
      (service-type aware) so ORS can remain a fallback.
- [ ] Update unit tests under `AccessibilityAnalysis/test/unit/service/` and
      `.../utils/` (`requestIsochrones.spec.js`, `createIsochrones.spec.js`,
      `styleIsochroneFeatures.spec.js`, fixtures `isochronesPoint.json`/`isochronesRegion.json`).
- [ ] Update `state` `serviceId`/`fallbackServiceId` (or service-type flag) to point at the
      new Valhalla rest-service id.

---

## 4. Author the COSI portalconfig (the core missing piece)

Create our own portal that actually loads COSI, since none exists in-repo.

- [ ] Create `masterportal/portal/cosi/` with:
  - `config.js` — `addons` array listing the COSI sub-tools (matching keys in
    `addons/addons/addonsConf.json`: `districtSelector`, `districtFinder`,
    `accessibilityAnalysis`, `dashboard`, `colorCodeMap`, `featuresList`,
    `distanceScoreService`, `polygonStyler`, `areaSelector`, `templateAdmin`,
    `templateManager`, `saveSession`, `calculateRatio`, `dipasProjects`, `reportingTool`,
    `cosiFileImport`, `cosiPrintLayoutSelection`, ...). Plus `layerConf`/`restConf`/`styleConf`.
  - `config.json` — menu + per-tool config blocks. This is where each COSI tool is wired in.
- [ ] Reference the original COSI portalconfig for the correct tool config blocks and menu
      structure. **Action: obtain it before it's lost** — ask the agency / check the
      `portalconfigs` repo / pull from the live staging/production instance config while we
      still have access. This is the single most valuable artifact to grab now.
- [ ] Verify how addons are discovered by the build (`addonsConf` path + Vite config in
      `masterportal/devtools/`) and that the nested `addons/addons` path resolves.

---

## 5. District levels: Stadtteile + Bezirke only (drop Statistische Gebiete)

Fully config-driven via DistrictSelector `districtLevels[]`
(see `cosi/DistrictSelector/doc/config.json.md`). We lose access to Statistische Gebiete data,
so configure only Stadtteile and Bezirke.

- [ ] In the COSI `config.json`, define `districtSelector.districtLevels` with **Stadtteile**
      and **Bezirke** entries only; omit the Statistische Gebiete entry entirely.
- [ ] For each level set: `layerId` (geometry WFS layer), `label`, `keyOfAttrName`,
      and `stats.{layerIds, keyOfAttrName, metadataUrls}` (statistical-data layers + the
      attribute-name keys). Add `duplicateDistrictNames` where a name exists at two levels
      (e.g. *Eimsbüttel* is both a Stadtteil and a Bezirk — name given at the higher level).
- [ ] **Name mapping** (user-confirmed this is needed): set `districtNamesMap` /
      `stats.keyOfAttrName` so geometry district names match the statistical-data attribute
      names (cf. the doc's `Steinwerder`→`Steinwerder/Kl. Grasbrook` examples).
- [ ] Confirm the geometry layer IDs (Stadtteile, Bezirke) and statistical-data layer IDs in
      our own `services.json`.

---

## 6. Self-host the service registries (services.json / rest-services.json)

Stop depending on `geodienste.hamburg.de` config endpoints; host our own, referencing only
the layers/services we actually keep.

- [ ] Create our own `services.json` (layer definitions) containing: Stadtteile + Bezirke
      geometry, the statistical-data WFS layers we retain, and any base/background layers.
- [ ] Create our own `rest-services.json` adding a **`valhalla`** entry (id used by
      AccessibilityAnalysis) and the **WPS** entry (id `1001` / `einwohner_ermitteln`) if kept.
- [ ] Point `config.js` `layerConf`/`restConf` at our hosted copies.
- [ ] **OGC API Features migration (forward-looking):** Hamburg UDP is replacing WFS with
      OGC API Features. Track whether Masterportal/masterportalapi supports OGC API Features
      layer types; plan a follow-up to migrate layer definitions when WFS is retired.

---

## 7. Verify retained Hamburg dependencies

- [?] Confirm the **WPS** `einwohner_ermitteln.fmw` (id `1001`) is genuinely public and stays
      reachable without LGV/fhhnet access. If not: disable/stub the residents-in-isochrone
      feature (low priority).
- [?] Confirm **statistical-data WFS** layers (population etc. for Stadtteile/Bezirke) remain
      accessible to us, and capture the exact layer IDs + attribute keys + name mappings.
- [ ] Snapshot/export the statistical data we need now, as a hedge against access ending
      before self-hosting is ready.

---

## 8. Dockerize & orchestrate the full COSI deployment

The biggest deployment gap: §2 containerizes **only Valhalla**. The actual COSI
portal (Masterportal framework + COSI addon, built into a static SPA) and the
self-hosted config registries (§6) have no container story, and nothing ties the
pieces together. We want a reproducible, one-command full-stack deploy that runs
the same locally and on the CSL server.

Target topology (single `docker compose up` at the repo root):
- **`portal`** — multi-stage image: build stage runs the Masterportal/COSI
  production build; runtime stage is nginx serving the static `dist/`.
- **`valhalla`** — the routing service from §2 (fold its compose into the root
  orchestration via `include:` / `extends`, keeping `valhalla/` self-contained).
- nginx also serves our self-hosted `services.json` / `rest-services.json` /
  `style.json` (§6) and **reverse-proxies `/valhalla/` → `valhalla:8002`** so the
  portal calls routing same-origin (avoids CORS + mixed-content; gives a stable
  URL independent of where Valhalla runs).
- WPS / statistical WFS stay **external** (Hamburg) for now (§7) — not containerized.

Tasks:
- [ ] Add a **`.dockerignore`** and a multi-stage **`Dockerfile`** for the portal.
      Build stage: Node `24.15.0`, reproduce the **layered install + broken-addons
      `postinstall` workaround** from §1 (`npm install` in `masterportal/`, then
      `addons/ npm install --ignore-scripts`, then `cosi/ npm install`), then
      `npm run build` of the `portal/cosi` portal (§4). Runtime stage: nginx
      serving `dist/`. **Depends on §4** (no COSI portalconfig exists yet) — until
      then the image can only build the stock example portal as a smoke test.
- [ ] **Runtime config injection:** keep `config.js` (`layerConf`/`restConf`/
      `styleConf`, Valhalla URL) overridable at container start (entrypoint that
      templates from env, or a mounted config) so one image works local vs CSL
      without a rebuild. Decide build-time vs runtime config (lean runtime).
- [ ] Author the **nginx config**: serve the SPA (history fallback), serve the
      §6 registries, gzip/cache static assets, and reverse-proxy `/valhalla/`.
- [ ] Create the **root `docker-compose.yml`** orchestrating `portal` + `valhalla`
      (via `include:`), shared network, healthchecks, `restart: unless-stopped`.
- [ ] Keep a clear **dev vs prod** split: dev stays on Vite (`npm start`, §1);
      prod/staging uses the built image. Document both in the root `Readme.md`.
- [ ] **Image build/publish:** decide registry + tagging (e.g. GHCR, tag by
      Masterportal+COSI version), and whether CI builds the image. Note the build
      is heavy (full npm install + Vite build).
- [ ] **CSL server bootstrap:** one script/compose bringing up the whole stack
      (portal + valhalla), TLS termination (reverse proxy / Let's Encrypt) for a
      public hostname, and resource notes (Valhalla build dominates — see §2).

---

## 9. Open questions / decisions

- [?] Where do the statistical data ultimately live long-term — keep consuming Hamburg's
      public WFS/OGC API, or import into our own store/service?
- [?] Distance-based isochrones needed, or time-based only? (affects §2/§3).
- [?] Target CSL server specs for Valhalla tile building (RAM/disk) and deployment method
      (plain docker-compose vs. orchestrated).
- [?] How much of the original portalconfig can we recover before access ends? (see §4).

---

## Next session — suggested first steps
1. **Grab the original COSI portalconfig** from the live instance / agency while access lasts
   (§4) — highest-value, time-sensitive.
2. Pin Node + run the layered install + boot the stock portal (§1).
3. Stand up Valhalla locally via docker-compose (§2) and rewrite `requestIsochrones.js` (§3).
4. Author `portal/cosi/` config with Stadtteile + Bezirke only (§4/§5).
