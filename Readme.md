# COSI — self-hosted

Self-hosted, open-source deployment of **COSI** (Cockpit Städtische Infrastrukturen), a
[Masterportal](https://www.masterportal.org/)-based urban-planning portal. Background, goals
and the full task list live in [`BACKLOG.md`](./BACKLOG.md).

Repo layout:

```
cosi/
├─ BACKLOG.md                 # working plan / task backlog
├─ .nvmrc                     # Node version pin (24.15.0)
└─ masterportal/              # upstream Masterportal v3.23.0 (own git checkout, on `dev`)
   ├─ .nvmrc                  # Node version pin (24.15.0)
   ├─ addons/                 # LGV addons; COSI lives in addons/cosi (v1.2.0)
   └─ portal/{master,auto,basic}/   # stock example portals (no COSI portal yet — see BACKLOG §4)
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

# b) Addons (incl. COSI). The addons package has a recursive `postinstall` that assumes the
#    full upstream addons layout and is currently broken in this checkout — it references a
#    missing `shared/js/mapfishUtils` dir and aborts the chain before reaching cosi. So install
#    the addons we use directly instead:
cd addons
npm install --ignore-scripts        # top-level addon deps, skip the broken postinstall
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

## Verified working versions

| Tool | Version |
|------|---------|
| Node | 24.15.0 |
| npm  | 11.12.1 |
| Masterportal | 3.23.0 |
| COSI addon | 1.2.0 |
| Vite dev server | serves on https://localhost:9001/ |

_Last verified: 2026-06-18._
