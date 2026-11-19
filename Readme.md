# COSI — self-hosted

**COSI** (*Cockpit Städtische Infrastrukturen*) is a web GIS for planning social
infrastructure in Hamburg — schools, day-care centres, youth and family services.
Planners select districts, compare statistics over time (dashboard), calculate
supply ratios (facilities per resident), draw catchment areas (isochrones) and
sketch planning scenarios.

COSI is a set of tools (an *addon*) for the [Masterportal](https://www.masterportal.org/),
the open-source map framework of the City of Hamburg. This repository packages
everything needed to **run COSI on your own server**: the Masterportal with the COSI
addon, the COSI portal configuration, a self-hosted routing service (Valhalla) and a
Docker deployment.

| Instance | Branch | URL |
|----------|--------|-----|
| Production | `main` | https://cosi.citysciencelab.hamburg/cosi/ |
| Beta (prototypes) | `beta` | separate server, see [Branches](#branches-main-and-beta) |

Data comes live from Hamburg's public services (`api.hamburg.de`, `geodienste.hamburg.de`);
nothing has to be imported to get started.

**Contents:** [Quick start](#quick-start) · [Repository layout](#repository-layout) ·
[Development](#development) · [Where to change what](#where-to-change-what) ·
[Contributing](#contributing) · [Branches](#branches-main-and-beta) ·
[Deployment](#deployment) · [Updating upstream](#updating-the-masterportal-upstream) ·
[Versions](#versions) · [License](#license)

## Quick start

**Run it** (needs only Docker, ≥ 8 GB RAM for the first build):

```bash
git clone git@github.com:citysciencelab/c4hh-cosi.git && cd c4hh-cosi
docker network create dokploy-network   # once per host, see deploy/Readme.md
docker compose up -d --build
```

Open http://localhost:8080/cosi/. The portal is ready after the image build (several
minutes). Isochrones work once Valhalla has built its routing tiles on the first start
(roughly 10–30 minutes, `docker compose logs -f valhalla`).

**Develop** (needs Node 24.22.3 via [nvm](https://github.com/nvm-sh/nvm)):

```bash
cd masterportal
nvm install && nvm use
npm install
(cd addons && npm install --ignore-scripts) && (cd addons/cosi && npm install)
npm start
```

Open https://localhost:9001/portal/cosi/ and accept the self-signed certificate.

## Repository layout

```
c4hh-cosi/
├─ docker-compose.yml       # the full stack: portal + Valhalla routing
├─ .env.example             # stack settings (ports, routing extract, GTFS feed)
├─ deploy/                  # portal image (Dockerfile), nginx config, cache warmer — see deploy/Readme.md
├─ valhalla/                # self-hosted routing service — see valhalla/Readme.md
├─ provenance/              # history backups from before the repo was flattened (rarely needed)
├─ BACKLOG.md               # open work, known bugs and limitations
├─ LICENSE                  # MIT
└─ masterportal/            # the Masterportal, vendored as plain files (no submodules)
   ├─ src/                  # Masterportal core (upstream code)
   ├─ addons/               # upstream addons repo …
   │  └─ cosi/              # … including the COSI addon: one folder per tool
   └─ portal/cosi/          # the COSI portal: config.json, config.js, registries, data
      ├─ assets/            # our own GeoJSON data (derived statistics, combined layers)
      └─ tools/             # Python generators for registries and data (see below)
```

`masterportal/` is a complete copy of the upstream code, kept in this repository on
purpose: one clone builds and runs, and our local fixes live next to the code they fix.
Upstream releases are merged in with git (see
[Updating upstream](#updating-the-masterportal-upstream)). `node_modules` is not tracked.

## Development

### Prerequisites

- **Node 24.22.3** (any `>=24.22.1 <25` works). Both `.nvmrc` files pin it; `.npmrc` sets
  `engine-strict`, so an older Node fails `npm install` with `EBADENGINE`.
- **Python 3** (standard library only) for the generators in `masterportal/portal/cosi/tools/`.
- **Docker** if you want isochrones locally (Valhalla) or to test the production image.

> **nvm silently uses the wrong Node?** If `npm_config_prefix` is set in your shell
> (common with a global npm prefix), nvm refuses to switch and you stay on the system
> Node. Run `unset npm_config_prefix` before `nvm use`.

### Install

Dependencies are installed in three layers. The addons' `postinstall` would install every
addon of the upstream repo, so it is skipped and only the COSI addon is installed:

```bash
cd masterportal
npm install                                   # Masterportal core
cd addons && npm install --ignore-scripts     # shared addon dependencies
cd cosi && npm install                        # the COSI addon
```

npm 11 prints an `install-scripts` warning (canvas, esbuild, core-js, @parcel/watcher);
the build does not need those scripts.

### Run

```bash
cd masterportal && npm start     # Vite dev server with hot reload
```

| URL | What |
|-----|------|
| https://localhost:9001/portal/cosi/ | COSI |
| https://localhost:9001/portal/master/ | stock Masterportal example (handy to tell core bugs from COSI bugs) |

Everything except isochrones works without further setup. For isochrones, run Valhalla
locally (`cd valhalla && ./bootstrap.sh`, details in [`valhalla/Readme.md`](./valhalla/Readme.md));
the dev config expects it at `http://localhost:8002`.

### Test, lint, build

```bash
cd masterportal
npx eslint addons/cosi/<Tool>             # lint what you touched (the whole repo: npm run lint)
npm test                                  # core unit tests (vitest)
node node_modules/.bin/vite build --config devtools/vite.config.js --mode production
                                          # production build → masterportal/dist/
```

**COSI unit tests:** the upstream vitest config excludes `addons/cosi/**`. To run them, use a
copy of the config without that line:

```bash
sed 's#^\(\s*\)"addons/cosi/\*\*/\*\.spec\.js",#\1// cosi tests on#' \
    devtools/vitest.config.js > devtools/vitest.cosi.config.js
npx vitest run --config devtools/vitest.cosi.config.js addons/cosi/<Tool>
rm devtools/vitest.cosi.config.js         # don't commit it
```

Many older COSI specs are marked `.skip` upstream; the ones of the tools we wrote
(e.g. `LayerFilter`, `LayerStyler`) all run.

**Checking the production build in a browser:** serve the build output with any static
server, e.g. `cd masterportal/dist && python3 -m http.server 8123`, then open
http://localhost:8123/cosi/. This is closer to production than the dev server and also
works for headless browser tests (the Vite dev server does not render headless).

## Where to change what

| I want to … | Change |
|-------------|--------|
| fix or extend a COSI tool | `masterportal/addons/cosi/<Tool>/` (Vue components, `store/`, `utils/`, `tests/unit/`) |
| add a new tool | a new folder in `addons/cosi/`, an entry in `masterportal/addons/addonsConf.json`, the name in the `addons` list of `portal/cosi/config.js` and a menu entry in `portal/cosi/config.json` |
| change menus, tools, the layer tree | `masterportal/portal/cosi/config.json` ([Masterportal config docs](./masterportal/docs/User/Portal-Config/config.json.md)) |
| add or remove a layer | add it to `config.json`, then regenerate the layer registry: `python3 portal/cosi/tools/build-registries.py` (writes `services.json` / `rest-services.json`) |
| add our own layer or statistics (not in Hamburg's catalogue) | data into `portal/cosi/assets/`, the service entry into `portal/cosi/tools/local-services.json`, then `build-registries.py`. Statistics also need an entry in the `districtSelector` config and in `portal/cosi/assets/mapping.json` |
| change the deployment | `deploy/` and `docker-compose.yml` ([`deploy/Readme.md`](./deploy/Readme.md)) |
| change routing | `valhalla/` and the `valhalla` entry in `portal/cosi/rest-services.json` |
| change Masterportal core code | `masterportal/src/` — possible, but it is a local divergence from upstream: keep it small and say so in the commit message |

Generated files (`services.json`, `rest-services.json`, `assets/*.geojson`) are committed,
so a deploy needs no generator run. Re-run the generator whenever you change its input,
and commit both.

## Contributing

0. **Pick something:** open work, known bugs and their known fixes are listed in
   [`BACKLOG.md`](./BACKLOG.md).
1. **Branch off the right base** (see [Branches](#branches-main-and-beta)): fixes and
   infrastructure off `main`, prototypes and new features off `beta`. Name it after the
   topic, e.g. `fix/dashboard-sum`, `feature/layer-styler`.
2. **Keep upstream code recognisable.** Prefer changes in `addons/cosi/` and
   `portal/cosi/` over changes in `masterportal/src/`. Don't reformat or reorganise upstream
   files; that makes every upstream merge harder.
3. **Before you push:** lint is clean, the unit tests of the tools you touched pass, the
   production build succeeds, and you clicked through the change in a browser. If you
   changed `config.json`, re-run `build-registries.py`.
4. **Commit messages** describe what changed and why, first line ≤ 72 characters. Mention
   when a commit touches upstream code.
5. **Pull request** on GitHub against the branch you started from. Describe how you tested.

The project's own code (portal config, deploy, routing, our tools) is documented in
English; UI texts are German (with English translations in each tool's `locales/`).

Changes to the upstream Masterportal or COSI addon are not sent back to the Geowerkstatt
Hamburg automatically; there is no contribution process for that yet. Fixes therefore stay
here and are carried along by the upstream merges.

## Branches: `main` and `beta`

- **`main`** is the official COSI state: the upstream releases, our self-hosting
  infrastructure (Valhalla, registries, Hamburg API cache, deploy) and bug fixes.
  Production runs `main`.
- **`beta`** is `main` plus our prototypes and own extensions: the "Förderung &
  Öffnungszeiten" prototype, the Sozialmonitoring statistics, the combined facility layers
  (Jugendorte/Familienorte), the derived-indicator workflow (Dashboard → Versorgungsanalyse),
  the new tools "Filter (neu)" and "Darstellung (neu)", the new draw tool and the mpaddon
  ("Externes Backend"). It runs as a separate instance, see
  [`deploy/Readme.md` → Beta instance](./deploy/Readme.md#beta-instance-branch-beta).

Rules:

1. **Changes flow `main` → `beta` only.** After every fix or upstream merge on `main`:
   `git switch beta && git merge main`. Never merge `beta` into `main` as a whole.
2. **A feature that may graduate** to production gets its own branch; merge it into `beta`
   to try it, and once it is ready merge the *same* feature branch into `main`.
3. **Throwaway experiments** may be committed straight to `beta`.
4. Some features were moved off `main` by revert commits ("Move … to beta", merged as
   33cedf71). To promote one of them, revert its "Move … to beta" commit on `main`. `beta`
   recorded that merge with `git merge -s ours`, so merging `main` into `beta` never removes
   them there.

## Deployment

The whole stack is one `docker compose up`: an nginx container with the built portal, plus
Valhalla. nginx also proxies and caches Hamburg's services, so the portal keeps working
during their frequent outages.

[`deploy/Readme.md`](./deploy/Readme.md) covers:

- a plain Docker host behind a reverse proxy (how production runs) and Dokploy (how beta runs)
- configuration via environment variables, resource needs, TLS
- the HVV timetable for public-transport isochrones, which has to be updated each
  timetable period
- warming the cache before a presentation

**Updating an instance:** `git pull && docker compose up -d --build`. Never use
`docker compose down -v` — the volumes hold the routing tiles and the data cache.

## Updating the Masterportal upstream

`masterportal/` contains two upstream repositories whose history is part of this repo, so
an upstream release is a normal git merge into a subdirectory:

| Directory | Upstream | Remote |
|-----------|----------|--------|
| `masterportal/` | [geowerkstatt-hamburg/masterportal](https://bitbucket.org/geowerkstatt-hamburg/masterportal) | fetch the bitbucket URL directly (the `upstream-mp` mirror on opencode.de lags behind) |
| `masterportal/addons/` | [geowerkstatt-hamburg/addons](https://bitbucket.org/geowerkstatt-hamburg/addons) | `upstream` |

```bash
git switch -c sync/upstream-<version> main

# Both repos use the same tag names: fetch them into separate namespaces.
git fetch --no-tags upstream '+refs/tags/v<version>:refs/up-addons/v<version>'
git fetch --no-tags https://bitbucket.org/geowerkstatt-hamburg/masterportal.git \
    '+refs/tags/v<version>:refs/up-core/v<version>'

git merge -X subtree=masterportal/addons refs/up-addons/v<version>
git merge -X subtree=masterportal refs/up-core/v<version>
```

Conflicts are usually limited to version numbers, `CHANGELOG.md`, `package-lock.json` and
`publiccode.yml` (take upstream's version), plus the few files we changed locally. Then:

1. Check `engines` in `masterportal/package.json`. If the Node version changed, update both
   `.nvmrc` files and the `FROM` line in `deploy/Dockerfile`.
2. Reinstall, lint, run the tests, build, and click through the main COSI tools (district
   selection, dashboard, supply analysis, isochrones).
3. Merge into `main`, then `main` into `beta`.

Local fixes in the vendored code merge like any other change and are kept.
[`provenance/README.md`](./provenance/README.md) describes the older history from before
this setup; you don't need it for syncing.

## Versions

| Component | Version |
|-----------|---------|
| Masterportal | 3.28.2 |
| COSI addon | 1.2.0 |
| Node / npm | 24.22.3 / 11.19.1 |

## License

This repository is published under the [MIT license](./LICENSE). The vendored
Masterportal and the COSI addon are published by the City of Hamburg, also under the MIT
license ([`masterportal/License.txt`](./masterportal/License.txt)). Map data and statistics
belong to their providers (Freie und Hansestadt Hamburg, LGV; HVV; OpenStreetMap
contributors) and are subject to their terms.
