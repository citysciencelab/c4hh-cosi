# Concept: Suppression List for the Weekly OSV Security Scan

> Relates to: `devtools/security/createJiraTicketFromOsv.mjs` and the `osv scan (security)` pipeline in `bitbucket-pipelines.yml`.
> Implemented; see `suppressionlist-implementation-plan.md` for the build-out.

## 1. Problem

The OSV scan runs weekly and creates a Jira ticket from the findings. In practice:

- Some findings **cannot** be fixed within a week (upstream has no patch yet).
- Some findings **will not** be fixed at all (dev-only dependency, not in the shipped bundle, false positive).
- Some findings are **already being worked on** under an existing ticket.

Without a way to record these decisions, every weekly run reproduces the same noise, and genuinely new findings get lost in it.

## 2. Goal

Every weekly ticket should make one question answerable at a glance: **what changed since last week?**

Everything already triaged is either hidden or demoted to a summary line. Nothing is hidden *permanently* or *silently*.

## 3. The suppression file

**Location:** `devtools/security/osvSuppressions.json` — versioned in Git, so every change to it is reviewable in a pull request.

```jsonc
{
  "schemaVersion": 1,
  "entries": [
    {
      "id": "GHSA-7fh5-64p2-3v2j",
      "package": "postcss",
      "ecosystem": "npm",
      "status": "wont-fix",
      "reason": "Build-time only dependency, not part of the shipped bundle.",
      "ticket": "BG-1234",
      "addedBy": "geodatenanwendungen@gv.hamburg.de",
      "addedOn": "2026-08-11",
      "reviewBy": "2026-11-11"
    }
  ]
}
```

### Field reference

| Field | Required | Purpose |
|---|---|---|
| `id` | ✅ | The OSV / GHSA / CVE identifier. Primary key. |
| `package` | ➖ | Scopes the entry to one package. Omit to suppress the vulnerability everywhere. |
| `ecosystem` | ➖ | Further scoping (`npm`, `PyPI`, …). Only meaningful with `package`. |
| `status` | ✅ | See the status table below. Drives which report section the finding lands in. |
| `reason` | ✅ | Free text. **This is the audit trail** — it is what an auditor reads in three years. |
| `ticket` | ➖ | Jira key of the tracking issue. Required in practice for `in-progress`. |
| `addedBy` | ✅ | Who made the decision. |
| `addedOn` | ✅ | ISO date, when the decision was made. |
| `reviewBy` | ✅ | ISO date. After this date the entry stops suppressing. See §5. |

## 4. Statuses

A single flat list with a `status` field, rather than separate category arrays — easier to validate, diff, and grep.

| Status | Meaning | Report section |
|---|---|---|
| `wont-fix` | Deliberate, permanent acceptance. Not exploitable in our context. | Suppressed (count only) |
| `false-positive` | The scanner is wrong — we don't use the affected code path, or the version detection is off. | Suppressed (count only) |
| `accepted-risk` | Real and applicable, but the risk is consciously accepted for now. | Suppressed (count only) |
| `in-progress` | Being fixed, has a ticket. | Known / In Progress |
| `upstream-blocked` | Waiting on a patch from the dependency maintainer. | Known / In Progress |

Rationale for the split: the first three are *decisions* and should be quiet. The last two are *pending work* and should stay visible so they don't stall forever.

## 5. Expiry — the most important rule

**Every entry must carry a `reviewBy` date.**

Once that date passes, the entry no longer suppresses anything. The finding reappears — but in a dedicated **Expired Review** section rather than in *New*, so it's obvious this is a re-triage and not a fresh discovery.

Without this, a `wont-fix` written today silently hides a finding indefinitely, long after the context that justified it stopped being true. This is the same mechanism osv-scanner uses natively with `ignoreUntil` in `osv-scanner.toml`.

**Suggested default review windows:**

| Status | Window |
|---|---|
| `in-progress` | 1 month |
| `upstream-blocked` | 3 months |
| `accepted-risk` | 6 months |
| `wont-fix` / `false-positive` | 12 months |

## 6. Matching rules

An entry matches a finding when **all** of the following hold:

1. **Identifier match** — the entry's `id` equals the finding's `vuln.id` **or** appears in the finding's `aliases` / `groups[].aliases`.
   > This matters: OSV identifiers alias each other (`GHSA-…` ↔ `CVE-…` ↔ `PYSEC-…`). If someone records the CVE but the scanner reports the GHSA, an ID-only comparison silently fails to suppress and the noise returns.
2. **Package scope** — if `package` is set, it must equal the finding's package name; if `ecosystem` is set, it must match too. If neither is set, the entry applies repository-wide.
3. **Not expired** — `reviewBy` is in the future.

Deliberately *not* matched on: package version. Version pinning would make entries break on every unrelated dependency bump.

## 7. Report structure

```
🔴 NEW (3)                  ← not in the list, above threshold — the action item
🟠 EXPIRED REVIEW (1)       ← reviewBy has passed, needs re-triage
🟡 KNOWN / IN PROGRESS (5)  ← in-progress + upstream-blocked, with Jira keys
⚪ SUPPRESSED (12)          ← wont-fix / accepted-risk / false-positive: count + IDs only
🧹 STALE ENTRIES (2)        ← in the file but no longer found by the scan
```

Two supporting rules:

- **Never suppress the count.** Even fully accepted findings contribute a visible number. A silent zero is indistinguishable from a broken scan.
- **Report stale entries.** IDs present in the file that no longer appear in any scan result are flagged as removable, so the file doesn't accumulate dead weight.

## 8. Ticket creation policy

Currently a ticket is created on every run, which will produce near-identical tickets week after week.

**Recommendation:** create a ticket only when the *New* or *Expired Review* sections are non-empty. If both are empty, log the summary and exit `0`.

Optional refinement: search Jira for an open issue carrying the `osv` label and add a comment instead of opening a second ticket.

## 9. Validation

Add a check to `npm run prePushHook` that fails on:

- Schema violations / unknown `status` values
- Duplicate `id` + `package` combinations
- Missing or unparseable `reviewBy`
- `reviewBy` more than 12 months in the future (prevents an effectively permanent suppression)
- `status: "in-progress"` without a `ticket`

This catches a malformed file locally, at the moment it's written, rather than in the weekly pipeline where nobody is watching.

## 10. Workflow for adding an entry

1. Weekly ticket lands with findings in the **New** section.
2. Triage each: fix it, or decide to suppress it.
3. To suppress, open a PR adding an entry to `osvSuppressions.json` with a real `reason` and a `reviewBy` date.
4. Reviewer approves the *decision*, not just the JSON.
5. Next week's run picks it up automatically.

The pull-request step is what makes this an audit trail rather than a place to bury inconvenient results.

## 11. Alternative considered

osv-scanner supports native suppression through `osv-scanner.toml`:

```toml
[[IgnoredVulns]]
id = "GHSA-7fh5-64p2-3v2j"
ignoreUntil = 2026-11-11
reason = "Build-time only dependency."
```

**Pro:** no custom code, understood by the tool itself, handles expiry.
**Con:** ignored findings are dropped from the output entirely — you lose the *Known / In Progress* and *Suppressed count* sections.

**Recommendation:** use the custom JSON for the categorised workflow described above. Optionally keep `osv-scanner.toml` for genuine false positives you never want to see again in any form.

## 12. Scope: main repository only

This concept covers the **masterportal repository only**. The `addons` repository is explicitly out of scope for now.

### Current state of addon coverage

The addons are **not** scanned by the weekly pipeline today. The main repository's `.gitignore` excludes `addons/*`, so the Bitbucket clone in the `osv scan (security)` step contains an empty `addons/` folder, and the step never clones `bitbucket.org/geowerkstatt-hamburg/addons.git`. The addons repository's own pipeline offers a manual `npm audit` step only — no OSV scan and no Jira integration.

Note the resulting discrepancy: a **local** run of the scanner does see the addons, because they are checked out in the working directory. Local results and pipeline results will therefore differ.

### Planned follow-up

A separate OSV pipeline will be added to the addons repository at a later date. It will need its own suppression file, since the two repositories are versioned and released independently.

That scan has to cover the 10 nested npm projects bootstrapped by the addons `postinstall` script — `sdpDownload`, `valuationPrint`, `waterRiskCheck`, `simulationTool`, `shared/js/mapfishUtils`, `vpiDashboard`, `gfiThemes/combinedGfi`, `cosi`, `storyTellingTool/storyCreator`, `storyTellingTool/storyManager`. A recursive `osv-scanner` run picks these up automatically once `npm install` has been executed, so no per-project configuration is required.

## 13. Open decisions

- Does the threshold (`OSV_MIN_CVSS_SCORE`, default 4) stay, now that a suppression list exists? Lowering it to 0 with a good suppression list gives better coverage.
- Should `reviewBy` expiry generate its own escalation (separate ticket / higher priority), or is a section in the weekly ticket enough?

## 14. Publication policy

The Masterportal is open source and used by many municipalities and public offices. The suppression file and this document are therefore **public artifacts**. That is a deliberate decision, not an oversight.

### Why publishing the suppression list is acceptable

`package-lock.json` is public. Anyone can run osv-scanner against the repository and obtain the same finding list we would be suppressing. The set of vulnerable dependencies is public information whether we publish our assessment or not.

What a suppression entry adds is the **assessment**, and assessments are defensive by nature. "Build-time only, not in the shipped bundle" does not help an attacker — it marks a path as a dead end.

### Why publishing is actively useful

Downstream users run their own scans against their own deployments, often under compliance obligations. Without a published assessment, every one of them re-triages the same findings independently, or asks us. A published list answers that question once, for everyone, and evidences the security posture of the product rather than merely asserting it.

### Rules for public entries

1. **`reason` states why a finding does not apply — never how it could be exploited.**
   - ✅ "Only used by the Vite build, not present in the bundle."
   - ❌ "Only reachable if a portal enables X with an unvalidated Y parameter."
2. **`accepted-risk` is the one sensitive status.** It means a real, applicable weakness is knowingly unfixed. Such entries carry a Jira key and a short neutral reason only; the full justification stays in the ticket.
3. **`addedBy` uses functional mailboxes or Jira account IDs, never personal addresses.** The repository is public and mirrored to openCode, so GDPR applies.
4. **Review the wording, not just the JSON.** A suppression pull request is a public statement about the product's security.

### Rejected alternative

Keeping the suppression file in a private repository that the pipeline clones with a deploy key. This costs an additional credential in the pipeline, prevents contributors from seeing why a finding is ignored, and makes the "safe product" claim harder to evidence — users would have to trust an assessment they cannot read.
