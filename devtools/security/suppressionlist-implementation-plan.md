# Implementation Plan: OSV Suppression List

> Companion to [suppression-concept.md](suppression-concept.md). The concept defines *what* and *why*; this document defines *how* and *in which order*.
> Status: **All phases complete.** Two items remain open, see Phase 7.

## Already done

The following changes to `createJiraTicketFromOsv.mjs` landed ahead of this plan, partly as bug fixes and partly as groundwork:

- **CVSS parsing fixed** — scores are read from `packages[].groups[].max_severity` instead of regex-scraping CVSS vector strings, which previously collapsed most V3 findings to a bogus `3.1` and filtered them out below the default threshold.
- **Deduplication added** — findings are keyed on `ecosystem|package|version|id`, so a vulnerability reported from several lock files is counted once.
- **Hardcoded personal Jira address removed** — the script now reads `JIRA_USER_EMAIL`, which the pipeline already exported but the script ignored.
- **Dry-run mode added** — `OSV_DRY_RUN=1` prints the Jira request body and exits without contacting Jira. No Jira credentials are required in this mode, which makes the ticket body inspectable while Phase 3 is built.
- **Network failures of the Jira request handled** — `fetch` is wrapped in `try`/`catch`, so a refused connection or DNS failure produces a readable message instead of a raw undici stack trace and an unhandled rejection.

---

## Phase 1 — Capture the data the matcher needs — **done**

**File:** `devtools/security/createJiraTicketFromOsv.mjs`

The finding objects carried no aliases, so the alias matching required by §6 of the concept could not work. Each finding now holds:

- `aliases` — union of `vuln.aliases` and the `aliases` of the matching entry in `pkg.groups`, with the finding's own id removed
- `sources` — the lock file paths a finding was seen in

The collection switched from an array plus a set of seen keys to a `Map`, so a repeat occurrence merges its lock file path into the existing finding instead of being dropped. `findGroup()` was extracted, since both the score and the alias lookup need the vulnerability's group.

No behavioural change to the report; the new fields are captured but not yet rendered.

## Phase 2 — The suppression module — **done**

**New file:** `devtools/security/osvSuppressions.mjs` — `loadSuppressions` is the only function touching the file system; everything else is pure and free of `process`.

| Function | Responsibility |
|---|---|
| `loadSuppressions(filePath)` | Read and `JSON.parse`. A missing file yields an empty list, so the pipeline keeps working before the file exists. Throws if `entries` is not an array. |
| `validateSuppressions(entries, today)` | Return an array of error strings. Shared by the pipeline and the pre-push check. |
| `findSuppression(finding, entries, today)` | ID-or-alias match → package/ecosystem scope → expiry. Returns `{entry, expired}` or `null`. |
| `classifyFindings(findings, entries, today)` | Returns `{newFindings, expired, known, suppressed, stale}`. |

**New file:** `devtools/security/osvSuppressions.json` — seeded as `{"schemaVersion": 1, "entries": []}`.

Decisions taken while implementing:

- Dates are compared as `YYYY-MM-DD` strings rather than `Date` objects, which keeps the expiry boundary free of timezone effects. `today` is passed in, so the functions stay deterministic and testable.
- A missing or malformed `reviewBy` counts as **expired**, so an invalid entry lets the finding resurface instead of hiding it.
- When several entries match a finding, an active one wins over an expired one, so an expired duplicate cannot mask a valid suppression.
- The bucket is named `newFindings`, not `isNew`, since `new` is reserved and the value is an array.

Keeping this module free of `fs` and `process` outside `loadSuppressions` is what makes Phase 6 testable.

## Phase 3 — Sectioned reporting — **done**

**File:** `devtools/security/createJiraTicketFromOsv.mjs`

The flat list was replaced by the five sections from §7 of the concept. Each section renders as an ADF `heading` plus a `codeBlock`, both in the ticket and on the console.

- Sections are capped at 50 entries, with a `… and N more` note, because Jira rejects oversized descriptions.
- Empty sections render as `none` rather than being omitted, per the "never suppress the count" rule. This also avoids empty ADF text nodes, which Jira rejects.
- *New*, *Expired Review* and *Known* use the aligned finding layout, with the Jira key appended when the entry has one. *Suppressed* renders identifiers and status only, keeping decided cases visible but quiet. *Stale* lists the entries themselves, not findings.
- The ticket summary now leads with the actionable numbers: `OSV weekly: 3 new, 1 expired review, 5 known`.
- The suppression file is resolved relative to the script via `import.meta.url`, while `osv-result.json` is still read from the working directory, matching how the pipeline writes it.

Use `OSV_DRY_RUN=1` together with the fixture in `devtools/security/osv-result.json` to inspect the rendered body.

Note: the CVSS threshold is applied *before* classification, so a suppressed finding below the threshold never reaches a section at all. If the open question in §13 of the concept resolves toward `OSV_MIN_CVSS_SCORE=0`, this stops mattering.

## Phase 4 — Ticket creation policy — **done**

**File:** `devtools/security/createJiraTicketFromOsv.mjs`

The script exits `0` without creating a ticket when *New* and *Expired Review* are both empty. The full report is printed to the console first, so the pipeline output stays useful either way.

- Only *New* and *Expired Review* count as actionable. A run that finds only *Known*, *Suppressed* or *Stale* entries produces no ticket, since those are triaged already and a weekly ticket would only repeat the previous week.
- Stale entries deliberately do not trigger a ticket on their own; removing a dead entry is housekeeping, not a security action.
- The check also applies in dry-run mode, so a dry run reports the decision the pipeline would actually take.

The dry-run switch originally planned here already exists, see *Already done*.

**Deferred:** commenting on an existing open issue with the `osv` label instead of opening a second ticket. Not implemented — the early exit removes most of the duplicate-ticket pressure, since a quiet week now produces nothing at all.

## Phase 5 — Validation gate — **done**

**New file:** `devtools/security/validateOsvSuppressions.mjs` — loads the suppression file, prints one line per violation and exits non-zero. A malformed JSON file is reported as a readable message rather than a stack trace.

**File:** `package.json`

- `"validateOsvSuppressions": "node devtools/security/validateOsvSuppressions.mjs"` added.
- Chained into `prePushHook` directly after the config parser and before ESLint, so the cheapest check fails first: config parser → **suppression validation** → eslint → buildJsDoc → test.

The enforced rules are listed in §9 of the concept and implemented in `validateSuppressions`.

## Phase 6 — Tests — **done**

**New file:** `devtools/security/osvFindings.mjs` — the normalization was extracted out of `createJiraTicketFromOsv.mjs`, which runs on import and calls `process.exit`, and was therefore not importable from a test. It exports `getCvssScore`, `getAliases` and `normalizeFindings`; the script now only orchestrates.

**New files:** `devtools/security/tests/osvFindings.spec.js` and `devtools/security/tests/osvSuppressions.spec.js`, using chai and vitest with a positive and a negative case per behaviour:

- alias matching, where the entry records the CVE and the scanner reports the GHSA
- package and ecosystem scoping, including the unscoped repository-wide entry
- the expiry boundary: `reviewBy` exactly today still suppresses, one day earlier does not
- a missing review date counting as expired, and an active entry winning over an expired duplicate
- stale detection, including that an expired but matching entry is not stale
- all six validation rules, with the twelve-month bound checked on both sides
- `max_severity` preferred over a vector string, the numeric fallback, and `null` when only a vector exists
- dedupe across two lock files with merged sources, and separate findings per package version

**File:** `devtools/vitest.config.js` — `devtools/**/*.spec.js` added to `include`, without which the tests never run.

Test data is built inline through small `buildEntry` and `buildFinding` helpers rather than read from `osv-result.json`. That file stays what it is: the fixture for manual dry runs.

The extraction also surfaced a `max-depth` violation that the `/* eslint-disable */` in the script had been hiding, fixed by moving the per-package loop into `collectPackageFindings`.

## Phase 7 — Rollout — **mostly done**

1. **Backlog obtained.** The scan of 2026-08-12 produced 41 unique findings across 12 packages.
2. **Suppression file seeded** with 39 entries covering axios, brace-expansion, cross-spawn, postcss, ip-address, nanoid, linkify-it, markdown-it, undici, immutable and fast-uri. Reasons are written to the §14 publication rules: they state why a finding does not apply, never how it could be exploited. Review windows follow §5, so `upstream-blocked` entries expire after three months and `wont-fix` after twelve.
3. **`/* eslint-disable */` removed** from `createJiraTicketFromOsv.mjs`. Fallout fixed: four unused Bitbucket environment constants deleted, a stale comment about parsing removed, and `n/no-process-env` switched off for `devtools/**/*.mjs` in `eslint.config.js`, since environment variables are how CI scripts are configured.
4. **Draft marker removed** from the concept document.

### Still open

- **`form-data` `GHSA-hmw2-7cc7-3qxx`** is deliberately *not* suppressed. The triage recommends fixing it with an `overrides` entry or an axios bump. It will appear under *New* until that happens, which is the intended pressure.
- **`elliptic` `GHSA-848j-6mx2-7j84`** is deliberately *not* suppressed. It is the one finding that may genuinely reach the bundle, because the `crypto` polyfill is not excluded in `devtools/vite.config.js`. Per §14 rule 2 an `accepted-risk` entry needs a Jira key, and the bundle check has to happen first.

---

## Sequencing

Phases 1–3 are the core and must land together to be useful. Phases 4, 5 and 6 are independent of one another and can follow in any order. Phase 7 step 2 should happen in the same week the feature goes live, otherwise the first ticket is unreadable.

## Risks

- **ADF formatting** is the fiddliest part. Test against a scratch Jira project before pointing it at `BG`.
- **Alias coverage** depends on osv-scanner populating `groups[].aliases`. Verify against a real `osv-result.json` artifact from a pipeline run rather than assuming the shape.
- **Threshold interaction** — if the open question in §13 of the concept resolves toward `OSV_MIN_CVSS_SCORE=0`, the initial triage backlog in Phase 7 grows substantially. Decide before rollout, not after.

## Out of scope

The `addons` repository, per §12 of the concept. Addons are currently not scanned by any pipeline; a separate OSV pipeline with its own suppression file is planned for later.
