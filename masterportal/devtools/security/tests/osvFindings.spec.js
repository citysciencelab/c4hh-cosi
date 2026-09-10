import {expect} from "chai";
import {getAliases, getCvssScore, normalizeFindings} from "../osvFindings.mjs";

describe("devtools/security/osvFindings", () => {
    describe("getCvssScore", () => {
        it("positive: prefers the numeric max_severity of the matching group", () => {
            const vuln = {
                    id: "GHSA-aaaa",
                    severity: [{type: "CVSS_V3", score: "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H"}]
                },
                groups = [{ids: ["GHSA-aaaa"], max_severity: "8.7"}];

            expect(getCvssScore(vuln, groups)).to.equal(8.7);
        });

        it("positive: falls back to a numeric severity score when no group matches", () => {
            const vuln = {id: "GHSA-aaaa", severity: [{type: "CVSS_V4", score: "7.5"}]};

            expect(getCvssScore(vuln, [{ids: ["GHSA-other"], max_severity: "9.9"}])).to.equal(7.5);
        });

        it("negative: returns null for a vector string instead of parsing a number out of it", () => {
            const vuln = {
                id: "GHSA-aaaa",
                severity: [{type: "CVSS_V3", score: "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H"}]
            };

            expect(getCvssScore(vuln, [])).to.be.null;
        });

        it("negative: returns null when no severity information exists at all", () => {
            expect(getCvssScore({id: "GHSA-aaaa"}, undefined)).to.be.null;
        });
    });

    describe("getAliases", () => {
        it("positive: merges the aliases of the vulnerability and of its group", () => {
            const vuln = {id: "GHSA-aaaa", aliases: ["CVE-2025-1111"]},
                groups = [{ids: ["GHSA-aaaa"], aliases: ["GHSA-aaaa", "CVE-2025-1111", "PYSEC-2025-1"]}];

            expect(getAliases(vuln, groups)).to.have.members(["CVE-2025-1111", "PYSEC-2025-1"]);
        });

        it("positive: removes the vulnerability's own id from the aliases", () => {
            const groups = [{ids: ["GHSA-aaaa"], aliases: ["GHSA-aaaa"]}];

            expect(getAliases({id: "GHSA-aaaa"}, groups)).to.deep.equal([]);
        });

        it("negative: returns an empty array when no aliases are reported", () => {
            expect(getAliases({id: "GHSA-aaaa"}, [])).to.deep.equal([]);
        });
    });

    describe("normalizeFindings", () => {
        /**
         * Builds an osv-scanner result for a single package in a single lock file.
         * @param {String} path The lock file path.
         * @param {Object} vuln The vulnerability to report.
         * @returns {Object} One entry of the "results" array.
         */
        function buildResult (path, vuln) {
            return {
                source: {path},
                packages: [{
                    package: {name: "form-data", version: "4.0.6", ecosystem: "npm"},
                    vulnerabilities: [vuln],
                    groups: [{ids: [vuln.id], max_severity: "8.7"}]
                }]
            };
        }

        it("positive: reports a vulnerability found in two lock files once and merges the sources", () => {
            const vuln = {id: "GHSA-aaaa", summary: "CRLF injection"},
                osv = {
                    results: [
                        buildResult("/build/package-lock.json", vuln),
                        buildResult("/build/addons/package-lock.json", vuln)
                    ]
                },
                findings = normalizeFindings(osv);

            expect(findings).to.have.lengthOf(1);
            expect(findings[0].sources).to.deep.equal([
                "/build/package-lock.json",
                "/build/addons/package-lock.json"
            ]);
        });

        it("positive: keeps findings apart when the same vulnerability affects different versions", () => {
            const vuln = {id: "GHSA-aaaa", summary: "CRLF injection"},
                osv = {
                    results: [{
                        source: {path: "/build/package-lock.json"},
                        packages: [
                            {
                                package: {name: "form-data", version: "4.0.6", ecosystem: "npm"},
                                vulnerabilities: [vuln],
                                groups: []
                            },
                            {
                                package: {name: "form-data", version: "3.0.1", ecosystem: "npm"},
                                vulnerabilities: [vuln],
                                groups: []
                            }
                        ]
                    }]
                },
                findings = normalizeFindings(osv);

            expect(findings).to.have.lengthOf(2);
            expect(findings.map(finding => finding.version)).to.deep.equal(["4.0.6", "3.0.1"]);
        });

        it("negative: returns an empty array when the document holds no results", () => {
            expect(normalizeFindings({})).to.deep.equal([]);
        });
    });
});
