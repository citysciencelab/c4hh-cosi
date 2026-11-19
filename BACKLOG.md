# Backlog

Open work on the self-hosted COSI, grouped by topic. How the stack works and how to
develop on it is in the [Readme](./Readme.md); this file is only about what is still
to do and what we know is broken.

Status: `[ ]` open · `[~]` in progress · `[?]` needs a decision. The branch in brackets
says where the work belongs (see Readme → *Branches*). Done items are removed; their
story is in the git history (the original self-hosting plan of June 2026 is in this
file's history up to 2026-11-19).

## Where we stand (2026-11-19)

- COSI runs completely on our own infrastructure: Masterportal 3.28.2 with the COSI
  addon 1.2.0, our own layer registries, self-hosted Valhalla routing (car, bike, foot,
  public transport from the HVV timetable) and a caching proxy in front of Hamburg's
  services. Production: https://cosi.citysciencelab.hamburg/cosi/ (`main`).
- All Hamburg data we use is public (statistics, district geometries, Fachdaten, the
  population WPS); nothing needs FHHNET access.
- Upstream releases are merged as subtree merges; our fixes in the vendored code
  survive them.
- `beta` carries our own tools and prototypes: "Filter (neu)", "Darstellung (neu)",
  the new draw tool, "Förderung & Öffnungszeiten", Sozialmonitoring statistics,
  combined facility layers, the derived-indicator workflow, the mpaddon.

## Known bugs and limitations

- [ ] **Printing and the PDF report always fail** (`main`). The print tool uses
      `printAppId: "cosi-dev-vite"`, the ReportingTool the app `cosiImage`; neither exists
      on Hamburg's public Mapfish print server (only on their internal one), so every job
      returns 500. On top, the ReportingTool ignores the error and then aborts the whole
      PDF (`ReportingTool.vue` ~1092/1134/1188). Options: run our own Mapfish Print with
      COSI templates, or switch to a public app and accept a different layout. Either way
      the error handling should report the failure instead of crashing.
- [ ] **Accessibility analysis ignores SensorThings layers** (`main`), e.g. "Elektro
      Ladestandorte" (18106): the layer type whitelist in `AccessibilityAnalysis.vue`
      (~634) only has WFS/OAF/GeoJSON. Fix known: add `SensorThings`, use
      `getLayerSource()` in the `featuresloadend` listener (~781). Note that SensorThings
      layers only load stations in the visible extent.
- [ ] **Supply analysis (Versorgungsanalyse) takes only one facility layer** (`main`):
      `coverageFunction()` in `CalculateRatio` compares a single layer name. Today we work
      around it with combined GeoJSON layers (`tools/build-combined-layer.py`, `beta`).
      Real multi-layer support would sum the matches of several layers per district.
- [ ] **Layers without `loadingStrategy: "all"` give view-dependent results** in the
      supply analysis (e.g. Parkraum 23866, 203 283 features, loads only the visible
      extent). Decide per layer: load all, or warn in the tool.
- [ ] **Scenario objects are invisible to the analyses** (`main`, upstream). The 3.x
      ScenarioBuilder places planning objects as points in its own layer; supply
      analysis, accessibility analysis and the feature list don't read that layer, and
      moved existing objects drop out of their source layer. The residential simulation
      (new inhabitants from a reference area) existed only in COSI 2.x. Watch upstream;
      our own planning work goes into the planning twin (see below).
- [ ] **Pre-existing console errors** (not regressions, also upstream): Dashboard
      `mounted` "reading 'style'"; html2canvas "Tainted canvas" after an isochrone; after a
      Hamburg 5xx a bogus `describeFeatureType` request with `version=undefined`.
- [ ] **4 ESLint errors in `addons/cosi`** (upstream code, auto-fixable). Fix them on a
      branch off `main` so `npx eslint addons/cosi` is clean.

## Operations

- [ ] **HVV timetable expires every timetable period.** When public-transport isochrones
      stop working, set the new `HVV_GTFS_URL` (Transparenzportal) and rebuild the tiles
      once (`FORCE_REBUILD=True`). Worth automating: a check that warns before the feed's
      end date.
- [ ] **Hamburg's OAF services are unreliable at night** (api.hamburg.de maintenance,
      roughly 22–05 h: 500s and timeouts). The caching proxy covers everything seen once;
      warm the cache before presentations (`deploy/warm-hh-cache.py`).
- [ ] **Wider routing extract.** Valhalla is built from the Hamburg city-state extract;
      HVV trips into the surrounding area are cut off. A wider extract needs more RAM and
      disk (see `valhalla/Readme.md`); measure on the production host before switching.
- [ ] **Prebuilt images.** The portal image is built on the server (≥ 4 GB RAM, several
      minutes). Publish it from CI (e.g. GHCR) and pull on deploy.
- [?] **Beta domain**: `beta.cosi.care4.hamburg` or `betacosi.care4.hamburg`.

## Self-hosting leftovers

- [ ] **66 layer ids in `config.json` are not in the public catalogue** (FHHNET-only or
      removed by Hamburg), e.g. 1170, 1171, 180, 19138–19153. `build-registries.py` lists
      them. Remove them from the layer tree or replace them with public equivalents.
- [ ] **Self-host `style_v3.json`** (and its icons) instead of loading Hamburg's public
      copy; today it is only cached by the proxy.
- [?] **Long-term home of the statistics**: keep reading Hamburg's public OAF services
      (current state, cached) or import them into our own store.
- [ ] Optional hedge: snapshot the statistics we use, in case Hamburg's access changes.
- [?] **Upstream contributions**: there is no process for sending our fixes back to the
      Geowerkstatt Hamburg yet. Until there is, fixes stay local and are carried along
      by the upstream merges. Candidates: the Valhalla isochrone backend, the CRS fix
      for the 3.28 GeoJSON utils (76fe5faf), the CalculateRatio and SensorThings fixes.
- [ ] **Upstream check at each sync**: whether upstream fixed the CRS handling of the
      GeoJSON utils (G31DEV1-4357) — expect conflicts in those ten files — and whether
      the ScenarioBuilder gained polygons, inhabitants or analysis support.

## Filter (neu) and Darstellung (neu) (`beta`)

Ports of the filter and style tools of the c4hh-app. Both work on any visible vector
layer, share one style stack (`addons/cosi/utils/layer/styleStack.js`) and run on
canvas, clustered and WebGL layers.

- [ ] **Save and share**: include filters and styles in SaveSession and in shared links.
- [ ] **Labels**: an attribute as text on the features (position, size, halo).
- [ ] **Hatching and symbol shapes** for areas and points (c4hh-app STIL-2/3).
- [ ] **Replace the old tools**: once the new ones cover them, remove "Daten filtern" and
      "Flächen stylen" from the beta menu.

## Planning twin (`beta`, after the MVP)

A separate small backend service will manage planning cases (Planfälle) for the whole
city: planned and demolished buildings, facilities and transit lines as an overlay on
the current state, with a year and a maturity level per change. COSI reads them. Work
in COSI starts once the service's MVP exists.

- [ ] **Login**: an optional login with the C4HH Keycloak (Masterportal's OIDC login,
      PKCE); COSI stays fully usable without it.
- [x] **Read planning cases as layers** (first step, `feature/planungszwilling`): four OAF
      layers in the folder „Planungszwilling (Beta, Demo-Daten)" read the demo planning case
      at 31.12.2029. The Planungszwilling (repo `c4hh-twin4planning`) puts planning case and
      date in the **path** (`/oaf/p/{planfall}/{stichtag}`), not in `datetime`, because many
      OAF clients drop extra query parameters; switching means swapping the layer `url`. It
      answers in EPSG:25832 (`crs`/`bbox-crs`), so the layers are plain Masterportal OAF
      layers. Origin per deploy via `PLANUNGSZWILLING_URL`; the Planungszwilling must allow
      the portal origin in `CORS_ORIGINS`. Styling is still generic (no colour per
      `pf_status`).
- [~] **Planning case tool** „Planungszwilling (Beta)" (`addons/cosi/PlanningTwin`, menu
      Simulation): read-only first step done. It lists the planning cases and their parts
      with thresholds, shows a timeline of all planned changes (project phases, one row per
      collection, ▲ neu / ● geändert / ✕ entfällt, hollow = below the threshold) and the
      yearly dwelling balance. Date slider and „Entfallene zeigen" switch the view of all
      `planungszwilling_*` layers; they are drawn by `pf_status`. Clicking a change jumps to
      its date and zooms to it. The base url comes from the layers' url, there is no own
      setting. Open:
  - [ ] statistics with plan (below) and comparison current state ↔ plan
  - [ ] login + submitting ScenarioBuilder scenarios as a variant / proposal. Needs on the
        Planungszwilling: CORS for POST with Bearer, a Keycloak client for COSI; the
        batch api takes CRS84 only
  - [ ] the planning style is set when the tool has been opened; a layer switched on
        before that shows the Masterportal default style
  - [ ] reifegrad threshold per request (e.g. in the path) would let users pick their own
        level of trust instead of creating a variant — to discuss with the service
  - [ ] the twin's collections still use demo/fixture sources; supply and accessibility
        analysis only make sense with the same Hamburg sources as COSI
- [ ] **Statistics with plan**: a per-district, per-year balance (dwellings, inhabitants,
      commercial floor space) in the long table format of the district statistics, so
      dashboard and supply analysis compute with the plan without code changes.

## Other tools

- [?] **simulationTool** (noise and wind, Urban Model Platform): ships in the vendored
      tree but is not configured. Needs a UMP account and the OIDC login; the backend
      was not reachable from outside in the last test (2026-10-08).
- [ ] **"Förderung & Öffnungszeiten" prototype** (`beta`): fictitious data, marked
      "AI GENERATED". The handover to the accessibility analysis sets the start point, but
      the user still has to start the calculation.
