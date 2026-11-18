# COSI — self-hosted

Self-hosted, open-source deployment of **COSI** (Cockpit Städtische Infrastrukturen), a
[Masterportal](https://www.masterportal.org/)-based urban-planning portal. Background, goals
and the full task list live in [`BACKLOG.md`](./BACKLOG.md).

Repo layout:

```
cosi/
├─ BACKLOG.md                 # working plan / task backlog
├─ .nvmrc                     # Node version pin (24.22.3)
├─ docker-compose.yml         # full-stack deploy: portal + valhalla (BACKLOG §8)
├─ deploy/                    # portal Dockerfile, nginx, entrypoint, CSL bootstrap
├─ valhalla/                  # self-hosted routing service (Docker; BACKLOG §2)
├─ provenance/                # git-history backups of the vendored trees (see its README)
└─ masterportal/              # VENDORED Masterportal v3.28.2 — plain tracked files, self-contained
   ├─ .nvmrc                  # Node version pin (24.22.3)
   ├─ addons/                 # agency addons (incl. our COSI addon, addons/cosi v1.2.0)
   └─ portal/
      ├─ cosi/                # the COSI portalconfig
      └─ {master,auto,basic}/ # stock example portals
```

> **Self-contained.** `masterportal/` is vendored directly into this repo (no nested git
> checkouts, no submodules): one clone has everything needed to build and run. `node_modules`
> is **not** tracked — run the install steps below after cloning. The upstream sources we
> vendored from, and how to pull newer versions, are documented under
> [Upstream updates](#addons-fork--upstream-updates) and [`provenance/README.md`](./provenance/README.md).

## Branches: `main` and `beta`

- **`main`** is the official COSI state: the upstream release tags (subtree merges), our
  self-hosting infrastructure (Valhalla, registries, Hamburg API cache, deploy) and bug fixes.
  Production (cosi.citysciencelab.hamburg) runs `main`.
- **`beta`** is `main` plus our prototypes, our own extensions and experiments: the
  "Förderung & Öffnungszeiten" prototype, the Sozialmonitoring statistics, the combined facility
  layers (Jugendorte/Familienorte), the derived-indicator workflow (Dashboard → Versorgungsanalyse)
  and the mpaddon ("Externes Backend"). It is deployed separately, see
  [`deploy/Readme.md` → Beta instance](./deploy/Readme.md#beta-instance-branch-beta).

Rules:

1. **Changes flow `main` → `beta` only.** After every upstream sync or fix on `main`:
   `git switch beta && git merge main`. Never merge `beta` into `main` as a whole.
2. **A feature that may graduate** gets its own branch off `main`; merge it into `beta` to try
   it, and once it is ready merge the *same* feature branch into `main`.
3. **Throwaway experiments** can be committed straight to `beta`.
4. The features listed above were moved off `main` by revert commits ("Move … to beta", merged
   as 33cedf71). To promote one of them to `main`, revert its "Move … to beta" commit on `main`.
   `beta` recorded that merge with `git merge -s ours`, so merging `main` into `beta` never
   removes them there.

## Local environment setup

### 1. Node / npm

Use **Node 24.22.3** (upstream CI uses 24.22.1; we pin the latest patch of the same LTS line).
Both `.nvmrc` files pin this version:

```bash
cd masterportal
nvm install   # first time only — installs the version from .nvmrc
nvm use       # selects Node 24.22.3
node -v       # v24.22.3
npm -v        # 11.19.1  (bundled with Node 24.22.3)
```

> **Why this exact version matters.** `.npmrc` sets `engine-strict=true`, and since
> Masterportal 3.28 the `package.json` `engines` field requires **`node >=24.22.1 <25`**
> (or `>=22.23.4 <23`) — upstream raised it to address Node security issues. Any older Node
> fails `npm install` with `EBADENGINE` (that's what happened earlier with 24.11.0, when
> masterportalapi needed `^24.11.1`). If you manage Node some other way, just make sure
> `node >= 24.22.1`.
>
> npm 11.19 (bundled with 24.22.x) no longer runs install scripts that aren't approved via
> `allowScripts` and prints an `install-scripts` warning listing them (canvas, esbuild,
> core-js, @parcel/watcher). The production build doesn't need any of them.

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
docker network create dokploy-network     # once; harmless off-Dokploy (see note)
docker compose up -d --build              # or: ./deploy/bootstrap-csl.sh (does this for you)
# → http://localhost:8080/cosi/
```

> The portal attaches to `dokploy-network` so Dokploy's Traefik can route the
> public domain to it. That network is created by Dokploy; outside Dokploy it
> doesn't exist, so create it once (idempotent — it just sits empty if you're not
> running Traefik). `deploy/bootstrap-csl.sh` does this automatically.

The portal image is a multi-stage build (Node 24.22.3 build → nginx runtime) that
reproduces the layered install below and runs the Vite production build. nginx
serves the SPA + our self-hosted registries (BACKLOG §6) and reverse-proxies
`/valhalla/` to the routing container, so the portal calls routing **same-origin**.
The **first** start also builds Valhalla's tiles (slow, resource-heavy — see
[`valhalla/Readme.md`](./valhalla/Readme.md)). Full details, runtime config
injection, image publishing and TLS: [`deploy/Readme.md`](./deploy/Readme.md).

## Addons fork & upstream updates

`masterportal/` is **vendored** — plain tracked files, no nested git repos. What we vendored,
pinned to which upstream commits, is in [`provenance/README.md`](./provenance/README.md):

| Tree | Upstream | Pinned at |
|------|----------|-----------|
| `masterportal/` core | `bitbucket.org/geowerkstatt-hamburg/masterportal` `dev` | `205a13ac0e` (v3.23.0 + 51) |
| `masterportal/addons/` | `bitbucket.org/geowerkstatt-hamburg/addons` | `f148b81e` base + our 4 `cosi-selfhost` commits |
| `masterportal/portal/cosi/` | authored here | — |

Our COSI changes are deliberately **additive and isolated** (the COSI addon lives in
`addons/cosi`; the portalconfig in `portal/cosi`; the only edit to core is `.nvmrc`). That
isolation is what keeps upstream syncs cheap — see BACKLOG §3/§10.

### Updating upstream

Vendoring means upstream is pulled in a **side checkout**, tested locally, then the verified
files are folded back into this repo (test-gated — never sync untested upstream straight in):

```bash
# 1. Side checkout — get the new upstream and replay our isolated changes onto it.
git clone https://bitbucket.org/geowerkstatt-hamburg/masterportal.git /tmp/mp-next
cd /tmp/mp-next && git checkout <new-tag-or-commit>   # e.g. a future v3.24.0
git clone https://bitbucket.org/geowerkstatt-hamburg/addons.git addons
cd addons && git checkout <new-addons-base>
git am "$OLDPWD"/../<this-repo>/provenance/addons-cosi-selfhost-patches/*.patch   # our 4 commits
cd .. && cp -r <this-repo>/masterportal/portal/cosi portal/cosi                   # our portalconfig

# 2. Build + run + TEST in the side checkout (see "Local environment setup" above).
npm install && (cd addons && npm install --ignore-scripts) && (cd addons/cosi && npm install)
npm start    # verify the COSI portal still works against the new upstream

# 3. Only once verified: fold the source back into THIS repo (node_modules/.git excluded),
#    then commit and refresh provenance (new pinned SHAs + regenerated patches).
rsync -a --delete --exclude node_modules --exclude .git /tmp/mp-next/ <this-repo>/masterportal/
```

If our addon commits needed conflict resolution during `git am`, regenerate the provenance
patches/bundle from the side checkout so they stay in sync — see `provenance/README.md`.

## Verified working versions

| Tool | Version |
|------|---------|
| Node | 24.22.3 |
| npm  | 11.19.1 |
| Masterportal | 3.28.2 |
| COSI addon | 1.2.0 |
| Vite dev server | serves on https://localhost:9001/ |

_Last verified: 2026-06-18._
