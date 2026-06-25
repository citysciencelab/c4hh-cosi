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
- [~] **Public-transport (multimodal) tiles — code done, local tile build BLOCKED (2026-06-26).**
      Updated `HVV_GTFS_URL` to the current **Apr–Dec 2026** feed (the old `.env.example` URL was a
      May 2025 feed whose service calendar has expired → would route no transit today). Verified the
      feed downloads (40 MB, 17,603 stops, service window covers today). Two build obstacles hit:
      1. **OOM** — `valhalla_ingest_transit` was killed because Docker Desktop's VM defaulted to
         **3.9 GB**. Raised to **8 GB** (`MemoryMiB: 8192` in `~/.docker/desktop/settings-store.json`;
         host has 15 GB). Ingest then passed. **CSL note: the transit build needs ≥~5 GB RAM.**
      2. **Upstream Valhalla bug (still blocking):** `valhalla_build_tiles -s enhance` aborts with
         `std::bad_array_new_length` **only when transit is included** (the car/bike/foot build
         enhances fine). Memory was low (354 MB) at the abort, so it is *not* OOM — it is a known,
         version-dependent fragility in Valhalla's GTFS+enhance path (see valhalla issues
         #4745/#4777/#4844/#5276). Suspect trigger: the HVV feed ships `frequencies.txt`
         (frequency-based trips), a known Valhalla GTFS pain point. **Local service restored to
         car/bike/foot** (rebuilt with `BUILD_TRANSIT=False`) so routing works meanwhile.
         **Options to unblock:** (a) pin a different Valhalla image/version known good for transit;
         (b) strip/expand `frequencies.txt` before the build; (c) build transit tiles as a separate
         overlay step instead of the single-pass enhance. **Needs a decision.**
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
- [x] **Implementation shape decided & built** (commit `758aa3ce` on `cosi-selfhost`):
      service-type-aware, ORS stays the default/fallback. New `utils/requestIsochronesValhalla.js`
      (single-origin requests, profile→costing map, s/m→min/km contours, response normalized to
      the ORS feature shape `{group_index, value, center}` ascending by value); a 3-line dispatch
      guard at the top of `requestIsochrones.js` (`serviceType === "valhalla"`, ORS body untouched);
      `serviceType` threaded through `createIsochrones.js` + the `methodsAnalysis` call; the `.vue`
      builds a backend-aware `baseUrl` (Valhalla `<url>/isochrone`, ORS `<url>/v2/isochrones`).
- [x] **Switch via config:** new `state.isochroneBackend` (default `"ors"`). To use Valhalla, set
      `isochroneBackend: "valhalla"` in the COSI `config.json` and point `serviceId` at the Valhalla
      rest-service id. ORS remains the fallback. (No hardcoded change to `serviceId` itself.)
- [x] **Unit tests:** new `test/unit/service/requestIsochronesValhalla.spec.js` (7 tests, vitest)
      covers conversions, request shape, response normalization/ordering, multi-origin grouping,
      and error handling. (The pre-existing `requestIsochrones`/`createIsochrones` specs are all
      `it.skip` — they hit live services — so nothing to update there.)
- [x] **Integration-test against a live local Valhalla** once tiles are built (§2) — verify the
      real response shape matches the fixtures and the units/profile mapping are correct.
      **Done 2026-06-25** against a live local Valhalla (Hamburg extract, `gis-ops` image
      v3.5.1, tiles built, `BUILD_TRANSIT=False`). Sent the exact body the code builds to
      `POST http://localhost:8002/isochrone` for every profile mapping: `pedestrian`
      (foot-walking/wheelchair), `auto` (driving-car), `bicycle` (cycling-regular) — all HTTP 200.
      Response contract matches `normalizeCollection` exactly: `FeatureCollection` of `Polygon`
      features each carrying `properties.contour` in **minutes** (e.g. 15/10/5 → `fromContour` →
      900/600/300 s, sorted ascending). Distance contours echo **km** (2/1 → 2000/1000 m). The 7
      `requestIsochronesValhalla` unit tests still pass (`npm test`, via `devtools/vitest.config.js`).
- [ ] **Refine `wheelchair`**: currently mapped to `pedestrian`; add Valhalla
      `costing_options.pedestrian` tuning if needed (no first-class wheelchair costing in Valhalla).
- [ ] Add the **`valhalla` rest-service entry** that `serviceId` points at — see §6.

---

## 4. COSI portalconfig — OBTAINED (now: get it running)

**We have the real portalconfig** (received 2026-06-25, lives at `masterportal/portal/cosi/`):
`config.js` (2.3 KB), `config.json` (240 KB — full menu + per-tool config blocks), plus
`assets/mapping.json`, `assets/templates/`, `resources/`, `index.html`/`index.php`/`urm.php`.
It lists all 21 COSI addons we have (`config.js` `addons: [...]`), and the tool blocks are
present (`accessibilityAnalysis`, `districtSelector`, `dashboard`, `reportingTool`, …).

**Key finding — this is the INTERNAL (fhhnet) config, not the public one:**
- `config.js` points the registries at Hamburg's **internal admin network**:
  `layerConf = …/services-fhhnet.json`, `restConf = …/lgv-config/rest-services-fhhnet.json`
  (`styleConf = …/style_v3.json`). The two `*-fhhnet.json` URLs **return 404 from the public
  internet** (verified 2026-06-25); the public `*-internet.json` equivalents return **200**.
- Routing still uses `bkg_ors` (×3); no `valhalla`/`isochroneBackend` yet (that's our §3 add).
- It is currently **untracked** (masterportal ignores `portal/*`; root ignores `/masterportal/`) —
  same situation the addons were in before §2.5.

### Recommended next-session sequence (do in order)

- [x] **1. Track the pristine config first, before editing anything.** Done 2026-06-25:
      `masterportal/portal/cosi/` is now its own **standalone git repo** (mirrors the §2.5 addons
      approach), invisible to both parents (`masterportal/.gitignore` ignores `portal/cosi`; root
      ignores `/masterportal/`). The as-received config is committed **byte-for-byte** (13 files,
      no edits) on branch **`cosi-selfhost`** and tagged **`fhhnet-original`** — the untouched
      baseline to diff every self-hosting edit against. Unlike addons there is **no upstream git
      repo** (the agency handed us files, not a repo), so there is no fork/rebase story here — the
      tag is purely a pristine-snapshot anchor; future edits land as commits on `cosi-selfhost`.
- [x] **2. Boot as-is** — Done 2026-06-25. `npm start` (Vite v8, `https://localhost:9001`) serves
      the portal at `https://localhost:9001/portal/cosi/`. Baseline confirmed at HTTP level:
      `index.html` / `config.js` / `config.json` (240 KB) / `assets/mapping.json` all **200**
      (config parses, addon wiring resolves), and Vite's "provided addons" log lists every COSI
      addon. The two fhhnet registries 404 as expected (`services-fhhnet.json`,
      `rest-services-fhhnet.json`), while `style_v3.json` **200** and both `-internet.json`
      variants **200** (so step 3's flip is viable). Also confirms **step 5**: all 21 `config.js`
      `addons[]` keys resolve in `addons/addonsConf.json`. *Visual render of the Vue tool panels
      not yet eyeballed in a browser (no headless browser installed) — open the URL to confirm.*
- [x] **3. Flip the registries to the public variants** — Done 2026-06-25 (config.js commit
      `ec2f52e` on `cosi-selfhost`). `services-fhhnet.json` → `services-internet.json`,
      `rest-services-fhhnet.json` → `rest-services-internet.json` (styleConf already public; ORS
      kept). **The portal now bootstraps and renders** — the white screen is gone. Note: the
      fhhnet 404s weren't just empty layers, they were **fatal to app bootstrap** (404 HTML broke
      `JSON.parse`, blank screen), so this flip is what makes the portal render at all, not polish.
- [x] **4. Catalogue what loads vs. fails** — Done 2026-06-25. Verified live in-browser against the
      public registries. **What works:** app shell + COSI tools render, public `services-internet.json`
      (6553 layers) / `rest-services-internet.json` (47 entries) / `style_v3.json` all load. Gaps:
      - **Basemap CORS (FIXED here):** the visible Geobasiskarten WMS (`33780`, present in the public
        registry) failed with a credentialed-CORS block + tile-load storm + one `AxiosError 400`,
        because `overwriteWmsLoadfunction:true` loads tiles via a credentialed fetch while geodienste
        returns `ACAO:*`. **Set `overwriteWmsLoadfunction:false`** (commit `82080e2`) → basemap renders,
        CORS/400 gone. *Forward-looking:* §8's nginx same-origin setup makes this moot in prod.
      - **FHHNET-only catalog/background layers missing** (harmless "not found" warnings, just absent
        from the catalog): subject layers `1170`/`1171` (Potenzialflächendatenbank PAUL–FHHNET),
        `8133`/`34444`/`34667`/`34668` (Orthophotos Straße–FHHNET), background candidates `8`, `22993`.
        → **§6**: omit these from our curated `services.json`. (Not core COSI machinery.)
      - **Statistische Gebiete** geometry/stats not public (user-confirmed) → **§5**: drop that level
        entirely, keep only Stadtteile + Bezirke.
      - Cosmetic only: a `legendURL` deprecation warning and empty-`StyleId` warnings — defer.
      - **WPS `1001` + statistical WFS** reachability not yet exercised (no tool run that hits them) →
        **§7** still open.
- [x] **5. Verify addon discovery** — Done 2026-06-25 (alongside step 2). Vite resolves the
      `addons/` path (startup "provided addons" log) and all 21 `config.js` `addons[]` keys match
      entries in `addons/addonsConf.json`.
- [x] **Later (after baseline):** wire our Valhalla backend (§3) into this config's
      `accessibilityAnalysis` block — add `isochroneBackend: "valhalla"` and point `serviceId`
      at the Valhalla rest-service (needs the §6 rest-service entry + a live local Valhalla, §2).
      **Done 2026-06-25** (`cosi-selfhost` config repo). The COSI `accessibilityAnalysis` tool block
      now sets `"isochroneBackend": "valhalla"` + `"serviceId": "valhalla"` (the §6 rest-service id).
      The separate stock Masterportal `routing` addon block is **left on `bkg_ors`** — different
      addon, outside §3 scope. Verified live end-to-end (see §3 integration-test entry). Local
      Valhalla stood up via `valhalla/bootstrap.sh` (Docker Desktop daemon started first; `.env`
      set to the Hamburg extract + `BUILD_TRANSIT=False` for a fast local build).

---

## 5. District levels: Stadtteile + Bezirke only (drop Statistische Gebiete)

Fully config-driven via DistrictSelector `districtLevels[]`
(see `cosi/DistrictSelector/doc/config.json.md`). We lose access to Statistische Gebiete data,
so configure only Stadtteile and Bezirke.

- [x] In the COSI `config.json`, define `districtSelector.districtLevels` with **Stadtteile**
      and **Bezirke** entries only; omit the Statistische Gebiete entry entirely. Done 2026-06-25:
      the as-received config had **four** levels (Statistische Gebiete `27773`, Stadtteile `28201`,
      Bezirke `28028`, Hamburg/FHH `28150`). Removed **Statistische Gebiete** only (not public —
      §4 catalogue). Also fixed the now-dangling `districtFinder.selectedLevelId`
      (`27773` → `28201`/Stadtteile) and removed the orphaned `27773` geometry layer from
      `Themenconfig`. JSON re-validates; no leftover refs to `27773`. **Hamburg/FHH (`28150`) is
      KEPT** (user wants the whole-city aggregate) — note its stats layers `31270`/`34898`
      public-reachability is still unverified (cf. §7).
- [x] For each level set: `layerId` (geometry WFS layer), `label`, `keyOfAttrName`,
      and `stats.{layerIds, keyOfAttrName, metadataUrls}` (statistical-data layers + the
      attribute-name keys). Add `duplicateDistrictNames` where a name exists at two levels
      (e.g. *Eimsbüttel* is both a Stadtteil and a Bezirk — name given at the higher level).
      Already fully configured in the as-received config and retained unchanged: Stadtteile
      (`keyOfAttrName: stadtteil_name`, 7 stats layers) and Bezirke (`bezirk_name`, 7 stats
      layers, `duplicateDistrictNames: [Eimsbüttel, Wandsbek, Bergedorf, Harburg]`).
- [x] **Name mapping** (user-confirmed this is needed): set `districtNamesMap` /
      `stats.keyOfAttrName` so geometry district names match the statistical-data attribute
      names (cf. the doc's `Steinwerder`→`Steinwerder/Kl. Grasbrook` examples). Already present
      on the retained Stadtteile level (`Steinwerder`, `Waltershof`, `St.Pauli`, `Moorburg`,
      `Neuland`, … maps) — retained unchanged.
- [x] Confirm the geometry layer IDs (Stadtteile `28201`, Bezirke `28028`) and statistical-data
      layer IDs (Stadtteile `31240`/`34505`/`34896`/`34503`/`35041`/`35046`/`35047`; Bezirke
      `31271`/`34504`/`34897`/`34502`/`35050`/`35051`/`35042`) in our own `services.json`.
      **Done 2026-06-25** alongside §6 — all present in the generated `services.json` (the generator
      derives the keep-list straight from these `config.json` references, so they are kept by
      construction; spot-checked `28201`/`28028`/`28150`/`31240`/`31271`/`31270` present).

---

## 6. Self-host the service registries (services.json / rest-services.json)

Stop depending on `geodienste.hamburg.de` config endpoints; host our own, referencing only
the layers/services we actually keep.

> **Reality check (§7 probe, 2026-06-25):** the *district/statistical* layers are now `typ: OAF`
> (served from `https://api.hamburg.de/datasets/v1/…`), but the wider Fachdaten catalogue is still
> mixed (of 451 kept: 262 WMS, 153 WFS, 30 OAF, 5 WCS, 1 SensorThings). Either way we copy each
> entry **verbatim** from `services-internet.json` regardless of type. The data endpoints stay
> external (api.hamburg.de / geodienste.hamburg.de); we self-host only the *registry JSON* so we
> control the layer list and the registry URLs.

- [x] Create our own `services.json` (layer definitions). **Done 2026-06-25 via an automated
      pruning generator** (`portal/cosi/tools/build-registries.py`) rather than hand-curation, so it
      never drifts from `config.json`. It walks every layer id referenced in `config.json` (layer
      tree + tool blocks: `districtSelector.layerId`/`stats.layerIds`, `districtFinder.selectedLevelId`,
      `additionalInfoLayers`), keeps only those present in the public upstream, and copies entries
      **verbatim**. Result: **451 layers** (from 6551 upstream) — `services.json` 849 KB raw / 68 KB
      gz (was 7.6 MB / 486 KB). The **64 referenced-but-not-public** ids are dropped + reported
      (incl. the §4 FHHNET-only set `1170`/`1171`/`8133`/`34444`/`34667`/`34668`/`8`/`22993`).
      *Follow-up:* those 64 should also be pruned from `config.json`'s layer tree so they stop
      appearing as broken catalogue entries (the generator prints the list).
- [x] Create our own `rest-services.json`. **Done 2026-06-25.** Kept the **full** public set (47
      entries — it is only ~10 KB, and addon code references ids not visible in `config.json`, e.g.
      the WPS `1001` population service which has no literal reference) **plus a `valhalla`** entry
      (`id: valhalla`, `url` default `http://localhost:8002`, → `/valhalla` in the §8 nginx deploy)
      for AccessibilityAnalysis. 48 entries total.
- [x] Point `config.js` `layerConf`/`restConf` at our hosted copies. **Done 2026-06-25:**
      `layerConf: "./services.json"`, `restConf: "./rest-services.json"` (served alongside the
      portal). Verified booting: portal page + both registries serve HTTP 200 at
      `https://localhost:9001/portal/cosi/`; served `services.json` = 451 layers, `rest-services.json`
      contains `valhalla`. (`styleConf` left on the public `style_v3.json` — out of §6 scope.)
- [x] ~~**OGC API Features migration (forward-looking):**~~ **Resolved 2026-06-25 — already done on
      Hamburg's side.** The public registry is 100 % OAF; Masterportal/COSI already supports the
      `OAF` layer type natively (the entries we boot against use it). No WFS layers remain to
      migrate; nothing to track.

---

## 7. Verify retained Hamburg dependencies

- [x] Confirm the **WPS** `einwohner_ermitteln.fmw` (id `1001`) is genuinely public and stays
      reachable without LGV/fhhnet access. **PUBLIC — verified 2026-06-25.** `GetCapabilities` on
      `https://geodienste.hamburg.de/HH_WPS` returns HTTP 200 and lists `einwohner_ermitteln.fmw`
      as a published process (alongside `ReverseGeocoder.fmw`, `schulwegrouting_wps.fmw`, …). No
      need to stub the residents-in-isochrone feature; keep WPS `1001` in the §6 rest-services.
- [x] Confirm **statistical-data** layers (population etc. for Stadtteile/Bezirke) remain
      accessible to us. **ALL PUBLIC — verified 2026-06-25.** All 16 retained stats layers return
      HTTP 200 with real GeoJSON via the public registry. **KEY FINDING: the district + statistical
      layers (and the geometry layers) are now `typ: OAF` (OGC API Features), not WFS** — the
      migration §6 called "forward-looking" has *already happened for these layers*. They are
      addressed as `https://api.hamburg.de/datasets/v1/{dataset}/collections/{collection}/items`
      (Accept: `application/geo+json`). (NB the *wider* Fachdaten catalogue is still mixed — of the
      451 layers we keep, 262 are WMS, 153 WFS, 30 OAF, 5 WCS, 1 SensorThings — so "all OAF" is true
      only for the district/stats family, not the whole registry.) Counts sanity-check out: Stadtteile geom 104, Bezirke 7,
      Landesgrenze 1; regionalstatistik Stadtteile 1188 rows / Bezirke 84 / HH-gesamt 12.
      **Caveat for §6: dataset↔layer is NOT 1:1** — some endpoints serve multiple collections
      (e.g. `kind_nicht_deutscher_fam_sprache` → both `_stadtteile` and `_bezirke`;
      `regionalstatistische_daten_bezirke` → both `_bezirke` and `_hh_gesamt`;
      `bevoelkerungsprognosen` → 3 collections). Attribute keys + name mappings already captured
      in the retained `districtSelector` config (§5). Full per-layer (id → url/collection) table
      dumped during the probe.
- [ ] Snapshot/export the statistical data we need now, as a hedge against access ending
      before self-hosting is ready. *(Optional — all sources confirmed live & public above.)*

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
- [x] How much of the original portalconfig can we recover? **Recovered the full internal
      (fhhnet) portalconfig on 2026-06-25** (see §4). Open follow-up: get a public-reachable
      build by repointing registries to `-internet.json` and self-hosting the rest (§6).

---

## Next session — suggested first steps

Done so far: §1 (env), §2 (Valhalla service), §2.5 (addons fork/tracking), §3 (Valhalla
isochrone backend), the **portalconfig is in hand** (§4), and **§4 is now running publicly**:
the COSI portal **boots and renders against public Hamburg infra** (registries flipped to
`-internet.json`, basemap fixed via `overwriteWmsLoadfunction:false`). Tracked on the
`cosi-selfhost` repo as 2 small diffs on top of the `fhhnet-original` baseline.

Remaining for a complete self-host:
1. ~~§4 steps 1–5: track pristine config, boot baseline, flip registries, catalogue gaps, verify
   addons.~~ **All done 2026-06-25** (see §4).
2. ~~**§5 — District levels:** Stadtteile + Bezirke (+ Hamburg, user-requested).~~ **Done
   2026-06-25** — dropped Statistische Gebiete only.
3. ~~**§7 — Verify retained Hamburg deps.**~~ **Done 2026-06-25** — WPS `1001` + all 16 stats
   layers + geometry confirmed **public**. Finding: the district/stats layers are now **OAF** (the
   WFS→OAF migration already happened for them; wider catalogue still mixed WMS/WFS). Optional
   data-snapshot hedge left open.
4. ~~**§6 — Self-host registries.**~~ **Done 2026-06-25.** Automated generator
   (`portal/cosi/tools/build-registries.py`) prunes 6551→451 layers from `config.json`'s refs and
   writes `services.json` + `rest-services.json` (full rest set + `valhalla`); `config.js` repointed
   to `./services.json` / `./rest-services.json`; portal boots against them. §5 verify checkbox
   closed. *Leftover:* prune the 64 FHHNET-only ids from `config.json`'s layer tree (generator lists
   them); optionally self-host `style_v3.json` too.
5. ~~**§4 "Later" / §3 wiring:** stand up local Valhalla (§2) and flip `accessibilityAnalysis` to
   it — set `isochroneBackend: "valhalla"` + `serviceId: "valhalla"` in `config.json`.~~ **Done
   2026-06-25.** Local Valhalla up (Hamburg tiles, `gis-ops` image), config flipped on
   `cosi-selfhost`, integration-tested live across all profiles + the 7 unit tests. ORS stays the
   fallback (`fallbackServiceId: "csl_ors"`).
6. **§8 — Dockerize the whole stack (NEXT):** multi-stage portal image (Node `24.15.0` build →
   nginx runtime), fold `valhalla/` compose in via `include:`, nginx serves the §6 registries and
   reverse-proxies `/valhalla/` → `valhalla:8002` (same-origin routing). Root `docker-compose.yml`
   for one-command `portal + valhalla`. Leftover from §6: prune the 64 FHHNET-only ids from
   `config.json`'s layer tree; optionally self-host `style_v3.json`.
