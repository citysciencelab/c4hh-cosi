import {expect} from "chai";
import {classifyFindings, findSuppression, validateSuppressions} from "../osvSuppressions.mjs";

/**
 * Builds a valid suppression entry that individual tests can override.
 * @param {Object} overrides The fields to change.
 * @returns {Object} A suppression entry.
 */
function buildEntry (overrides = {}) {
    return {
        id: "GHSA-aaaa",
        status: "wont-fix",
        reason: "Build tooling only.",
        addedBy: "geodatenanwendungen@gv.hamburg.de",
        addedOn: "2026-01-01",
        reviewBy: "2026-12-31",
        ...overrides
    };
}

/**
 * Builds a normalized finding that individual tests can override.
 * @param {Object} overrides The fields to change.
 * @returns {Object} A finding.
 */
function buildFinding (overrides = {}) {
    return {
        id: "GHSA-aaaa",
        aliases: [],
        packageName: "form-data",
        ecosystem: "npm",
        version: "4.0.6",
        cvssScore: 8.7,
        summary: "CRLF injection",
        sources: ["/build/package-lock.json"],
        ...overrides
    };
}

describe("devtools/security/osvSuppressions", () => {
    describe("findSuppression", () => {
        it("positive: matches an entry that references an alias of the reported id", () => {
            const entry = buildEntry({id: "CVE-2025-1111"}),
                finding = buildFinding({aliases: ["CVE-2025-1111"]}),
                match = findSuppression(finding, [entry], "2026-08-13");

            expect(match.entry).to.equal(entry);
            expect(match.expired).to.be.false;
        });

        it("positive: applies a repository wide entry that names no package", () => {
            const match = findSuppression(buildFinding(), [buildEntry()], "2026-08-13");

            expect(match).to.not.be.null;
        });

        it("positive: still suppresses on the review date itself", () => {
            const match = findSuppression(buildFinding(), [buildEntry({reviewBy: "2026-08-13"})], "2026-08-13");

            expect(match.expired).to.be.false;
        });

        it("positive: prefers an active entry over an expired duplicate", () => {
            const expired = buildEntry({reviewBy: "2026-01-01"}),
                active = buildEntry({reviewBy: "2027-01-01"}),
                match = findSuppression(buildFinding(), [expired, active], "2026-08-13");

            expect(match.entry).to.equal(active);
            expect(match.expired).to.be.false;
        });

        it("negative: reports the entry as expired one day after the review date", () => {
            const match = findSuppression(buildFinding(), [buildEntry({reviewBy: "2026-08-12"})], "2026-08-13");

            expect(match.expired).to.be.true;
        });

        it("negative: treats a missing review date as expired", () => {
            const match = findSuppression(buildFinding(), [buildEntry({reviewBy: undefined})], "2026-08-13");

            expect(match.expired).to.be.true;
        });

        it("negative: does not match when the entry names a different package", () => {
            const entry = buildEntry({package: "postcss"});

            expect(findSuppression(buildFinding(), [entry], "2026-08-13")).to.be.null;
        });

        it("negative: does not match when the entry names a different ecosystem", () => {
            const entry = buildEntry({ecosystem: "PyPI"});

            expect(findSuppression(buildFinding(), [entry], "2026-08-13")).to.be.null;
        });

        it("negative: returns null when no entry references the finding", () => {
            expect(findSuppression(buildFinding(), [buildEntry({id: "GHSA-bbbb"})], "2026-08-13")).to.be.null;
        });
    });

    describe("classifyFindings", () => {
        it("positive: sorts findings into the report sections", () => {
            const findings = [
                    buildFinding({id: "GHSA-new"}),
                    buildFinding({id: "GHSA-known"}),
                    buildFinding({id: "GHSA-quiet"}),
                    buildFinding({id: "GHSA-old"})
                ],
                entries = [
                    buildEntry({id: "GHSA-known", status: "in-progress", ticket: "BG-1"}),
                    buildEntry({id: "GHSA-quiet", status: "wont-fix"}),
                    buildEntry({id: "GHSA-old", reviewBy: "2026-01-01"})
                ],
                sections = classifyFindings(findings, entries, "2026-08-13");

            expect(sections.newFindings.map(finding => finding.id)).to.deep.equal(["GHSA-new"]);
            expect(sections.known.map(finding => finding.id)).to.deep.equal(["GHSA-known"]);
            expect(sections.suppressed.map(finding => finding.id)).to.deep.equal(["GHSA-quiet"]);
            expect(sections.expired.map(finding => finding.id)).to.deep.equal(["GHSA-old"]);
            expect(sections.stale).to.deep.equal([]);
        });

        it("positive: attaches the matching entry to a classified finding", () => {
            const entry = buildEntry({status: "upstream-blocked"}),
                sections = classifyFindings([buildFinding()], [entry], "2026-08-13");

            expect(sections.known[0].suppression).to.equal(entry);
        });

        it("negative: reports an entry that matches nothing as stale", () => {
            const stale = buildEntry({id: "GHSA-gone"}),
                sections = classifyFindings([buildFinding()], [stale], "2026-08-13");

            expect(sections.stale).to.deep.equal([stale]);
            expect(sections.newFindings).to.have.lengthOf(1);
        });

        it("negative: does not treat an expired but matching entry as stale", () => {
            const entry = buildEntry({reviewBy: "2026-01-01"}),
                sections = classifyFindings([buildFinding()], [entry], "2026-08-13");

            expect(sections.stale).to.deep.equal([]);
            expect(sections.expired).to.have.lengthOf(1);
        });
    });

    describe("validateSuppressions", () => {
        it("positive: accepts a complete entry", () => {
            expect(validateSuppressions([buildEntry()], "2026-08-13")).to.deep.equal([]);
        });

        it("positive: accepts a review date exactly twelve months ahead", () => {
            expect(validateSuppressions([buildEntry({reviewBy: "2027-08-13"})], "2026-08-13")).to.deep.equal([]);
        });

        it("negative: reports a missing required field", () => {
            const errors = validateSuppressions([buildEntry({reason: undefined})], "2026-08-13");

            expect(errors).to.have.lengthOf(1);
            expect(errors[0]).to.contain("\"reason\" is required");
        });

        it("negative: reports an unknown status", () => {
            const errors = validateSuppressions([buildEntry({status: "maybe-later"})], "2026-08-13");

            expect(errors[0]).to.contain("unknown status");
        });

        it("negative: reports an in-progress entry without a ticket", () => {
            const errors = validateSuppressions([buildEntry({status: "in-progress"})], "2026-08-13");

            expect(errors[0]).to.contain("requires a \"ticket\"");
        });

        it("negative: reports a malformed date", () => {
            const errors = validateSuppressions([buildEntry({reviewBy: "31.12.2026"})], "2026-08-13");

            expect(errors[0]).to.contain("YYYY-MM-DD");
        });

        it("negative: reports a review date more than twelve months ahead", () => {
            const errors = validateSuppressions([buildEntry({reviewBy: "2027-08-14"})], "2026-08-13");

            expect(errors[0]).to.contain("must not be more than 12 months");
        });

        it("negative: reports two entries with the same id and package", () => {
            const errors = validateSuppressions([buildEntry(), buildEntry()], "2026-08-13");

            expect(errors[0]).to.contain("duplicates entry 1");
        });

        it("positive: accepts the same id twice when it is scoped to different packages", () => {
            const entries = [buildEntry({package: "form-data"}), buildEntry({package: "postcss"})];

            expect(validateSuppressions(entries, "2026-08-13")).to.deep.equal([]);
        });
    });
});
