# Provenance — upstream history of the vendored `masterportal/`

`masterportal/` used to be three separate git checkouts nested inside this repo
(each with its own `.git`). To make this repo **self-contained** (one clone →
build → run, no external fetches), that tree was flattened into plain tracked
files and the nested `.git` dirs were removed.

This directory preserves the history that lived only in those nested repos, so
nothing is lost. The working **source** is fully vendored under `masterportal/`;
these artifacts are provenance/history backups only.

## What was vendored, and from where

| Tree                       | Upstream                                                        | Pinned at | Our work |
|----------------------------|----------------------------------------------------------------|-----------|----------|
| `masterportal/` (core)     | `bitbucket.org/geowerkstatt-hamburg/masterportal` branch `dev` | `205a13ac0e` (`v3.23.0-51-g205a13ac0e`) | pristine upstream + our `.nvmrc` |
| `masterportal/addons/`     | `bitbucket.org/geowerkstatt-hamburg/addons`                    | forked at `f148b81e4a` (merge-base with `upstream/dev`) | 4 commits on branch `cosi-selfhost`, tip `8938fa15` — the COSI addon (`addons/cosi`) |
| `masterportal/portal/cosi/`| none (authored here)                                           | tip `d3bb25a` | all 8 commits — the COSI portalconfig |

Core was pristine upstream, so its history is **not** backed up here — re-fetch it
from bitbucket if needed. Only the two local-only histories below are preserved.

## Artifacts

- `portal-cosi.bundle` — **complete** history of `masterportal/portal/cosi`
  (8 commits, no upstream remote — existed nowhere else).
- `addons-cosi-selfhost.bundle` — **thin** bundle: our 4 `cosi-selfhost` commits
  on top of upstream merge-base `f148b81e4a` (requires that prerequisite, which
  is on bitbucket `upstream/dev`).
- `addons-cosi-selfhost-patches/*.patch` — the same 4 commits as standalone
  `git format-patch` files. **Self-contained** (apply onto the vendored
  `masterportal/addons/` tree, no bitbucket needed) — the bitbucket-independent
  backup of our addon work.

## Restoring history (only if you need the git history, not the code)

The code is already in `masterportal/` — you only need this to recover commit
history/authorship.

```bash
# portal/cosi — fully standalone:
git clone provenance/portal-cosi.bundle /tmp/portal-cosi-history

# addons — needs the upstream prerequisite first:
git clone https://bitbucket.org/geowerkstatt-hamburg/addons.git /tmp/addons
git -C /tmp/addons fetch ../path/to/provenance/addons-cosi-selfhost.bundle cosi-selfhost:cosi-selfhost
# …or, bitbucket-independently, replay the patches onto the vendored tree:
git -C masterportal/addons am ../../provenance/addons-cosi-selfhost-patches/*.patch
```

## Syncing a newer upstream masterportal/addons — see ../Readme.md ("Updating upstream").
