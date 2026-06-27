# COSI — self-hosted

Self-hosted, open-source deployment of **COSI** (Cockpit Städtische Infrastrukturen), a
[Masterportal](https://www.masterportal.org/)-based urban-planning portal. Background, goals
and the full task list live in [`BACKLOG.md`](./BACKLOG.md).

Repo layout:

```
cosi/
├─ BACKLOG.md                 # working plan / task backlog
├─ .nvmrc                     # Node version pin (24.15.0)
├─ docker-compose.yml         # full-stack deploy: portal + valhalla (BACKLOG §8)
├─ deploy/                    # portal Dockerfile, nginx, entrypoint, CSL bootstrap
├─ valhalla/                  # self-hosted routing service (Docker; BACKLOG §2)
└─ masterportal/              # upstream Masterportal v3.23.0 (own git checkout, on `dev`)
   ├─ .nvmrc                  # Node version pin (24.15.0)
   ├─ addons/                 # standalone fork of the agency addons repo (own git history,
   │                          #   branch cosi-selfhost); COSI lives in addons/cosi (v1.2.0)
   └─ portal/
      ├─ cosi/                # the COSI portalconfig (own git repo, branch cosi-selfhost)
      └─ {master,auto,basic}/ # stock example portals
```

## Local environment setup

### 1. Node / npm

Use **Node 24.15.0** (matches CI). Both `.nvmrc` files pin this version:

```bash
cd masterportal
nvm install   # first time only — installs the version from .nvmrc
nvm use       # selects Node 24.15.0
node -v       # v24.15.0
npm -v        # 11.12.1  (bundled with Node 24.15.0)
```

> **Why this exact version matters.** `.npmrc` sets `engine-strict=true`, and the transitive
> dependency `@masterportal/masterportalapi@2.62.0` requires **`node ^24.11.1`** and
> **`npm ^11.6.2`** — stricter than the `package.json` `engines` range (`>=24 <25`). Node
> **24.11.0 / npm 11.6.1 fail the install** with `EBADENGINE` (they are one patch below the
> minimum). Node 24.15.0 ships an npm new enough (11.12.1) to satisfy both. If you manage Node
> some other way, just make sure `node >= 24.11.1` **and** `npm >= 11.6.2`.

### 2. Install dependencies (layered)

```bash
# a) Masterportal framework
cd masterportal
npm install

# b) Addons (incl. COSI). We install only the addons we actually use, skipping the recursive
#    `postinstall` (it tries to build every addon's sub-deps; we don't need most of them):
cd addons
npm install --ignore-scripts        # top-level addon deps, skip the heavy recursive postinstall
cd cosi && npm install && cd ..     # the COSI addon (~200 packages) — the one we need

# Other addons used by the stock examples can be installed the same way if needed, e.g.:
#   for d in sdpDownload vcOblique valuationPrint waterRiskCheck simulationTool \
#            vpiDashboard gfiThemes/combinedGfi storyTellingTool/storyCreator \
#            storyTellingTool/storyManager; do (cd "$d" && npm install); done
```

### 3. Sanity-boot the stock portal

Confirms the toolchain works before we author the COSI portal (BACKLOG §4):

```bash
cd masterportal
npm start            # runs `prestart` (generates a self-signed dev cert) then `vite`
```

Then open **https://localhost:9001/** (accept the self-signed cert). The stock example portals
are at `https://localhost:9001/portal/master/`. On boot, Vite logs a `provided addons: [...]`
list that already includes the COSI tools (`districtSelector`, `accessibilityAnalysis`,
`dashboard`, `colorCodeMap`, `featuresList`, …), confirming the COSI addon is discovered.

> Note: the stock portals do **not** load any COSI tool yet — there is no COSI portalconfig in
> this repo. Authoring `portal/cosi/` is tracked in BACKLOG §4.

## Deployment (Docker) — dev vs prod

Two ways to run the portal; pick by what you're doing.

**Dev — Vite dev server** (fast hot-reload, for working on the code/config):

```bash
cd masterportal && npm start          # https://localhost:9001/portal/cosi/
```

**Prod / staging — full stack in Docker** (the built SPA behind nginx + the
self-hosted Valhalla routing service, one command — BACKLOG §8):

```bash
cp .env.example .env                      # optional: PORTAL_PORT, etc.
cp valhalla/.env.example valhalla/.env    # optional: tune routing (BACKLOG §2)
docker compose up -d --build              # or: ./deploy/bootstrap-csl.sh
# → http://localhost:8080/cosi/
```

The portal image is a multi-stage build (Node 24.15.0 build → nginx runtime) that
reproduces the layered install below and runs the Vite production build. nginx
serves the SPA + our self-hosted registries (BACKLOG §6) and reverse-proxies
`/valhalla/` to the routing container, so the portal calls routing **same-origin**.
The **first** start also builds Valhalla's tiles (slow, resource-heavy — see
[`valhalla/Readme.md`](./valhalla/Readme.md)). Full details, runtime config
injection, image publishing and TLS: [`deploy/Readme.md`](./deploy/Readme.md).

## Addons fork & upstream updates

`masterportal/addons/` is its **own standalone git repository** — a fork of the agency's addons
repo. It is intentionally invisible to both parent repos (`masterportal/.gitignore` ignores
`addons/*`; the project root ignores `/masterportal/`), so it keeps its own history without
interfering with them.

This is what lets us pull future COSI releases from the agency **without redoing** our own
changes (notably the Valhalla routing migration, BACKLOG §3): our work lives as commits on the
`cosi-selfhost` branch on top of a pinned upstream base, so a new upstream version is a
`rebase`, not a rewrite.

| | |
|---|---|
| Remote `upstream` | `https://bitbucket.org/geowerkstatt-hamburg/addons.git` |
| Our branch | `cosi-selfhost` |
| Pinned base | `f148b81e` (tag `upstream-base`) — `dev` @ 2026-06-16, = v3.23.0 + unreleased work |
| `origin` (our hosted fork) | **not set yet** — create a fork, then `git remote add origin <url> && git push -u origin cosi-selfhost` |

> One local correction is baked into the base: this checkout had `mapfishUtils/` flattened (a
> partial-checkout artifact that broke the addons `postinstall` and the `shared/js/mapfishUtils`
> imports used by `cosi/ReportingTool`, `valuationPrint`, `waterRiskCheck`). It is restored to
> the upstream path `shared/js/mapfishUtils/`, so the working tree matches `f148b81e` exactly.

### Pull in a new upstream COSI version

```bash
cd masterportal/addons
git fetch upstream --tags
git rebase <new-tag-or-commit>      # e.g. a future v3.24.0 — replays our cosi-selfhost commits
# resolve conflicts only where upstream touched the same lines we did, then refresh deps:
npm install --ignore-scripts && (cd cosi && npm install)
```

Keeping our changes **additive and isolated** (new files + minimal dispatch seams) is what keeps
these rebases conflict-free — see BACKLOG §3 for the AccessibilityAnalysis/Valhalla approach and
§10 for the full update strategy.

## Verified working versions

| Tool | Version |
|------|---------|
| Node | 24.15.0 |
| npm  | 11.12.1 |
| Masterportal | 3.23.0 |
| COSI addon | 1.2.0 |
| Vite dev server | serves on https://localhost:9001/ |

_Last verified: 2026-06-18._
