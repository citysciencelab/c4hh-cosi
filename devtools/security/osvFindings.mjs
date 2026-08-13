/**
 * Finds the vulnerability group a vulnerability belongs to.
 * @param {Object} vuln The vulnerability as reported by osv-scanner.
 * @param {Object[]} groups The vulnerability groups of the package the vulnerability belongs to.
 * @returns {Object|undefined} The matching group or undefined if there is none.
 */
function findGroup (vuln, groups) {
    return (groups || []).find(candidate => (candidate.ids || []).includes(vuln.id));
}

/**
 * Determines the numeric CVSS base score of a vulnerability.
 * "severity" entries may hold a CVSS vector string (e.g. "CVSS:3.1/AV:N/...") instead of a
 * number, which must never be parsed as a score, so the group score is preferred.
 * @param {Object} vuln The vulnerability as reported by osv-scanner.
 * @param {Object[]} groups The vulnerability groups of the package the vulnerability belongs to.
 * @returns {Number|null} The CVSS base score or null if it is unknown.
 */
export function getCvssScore (vuln, groups) {
    const groupScore = Number(findGroup(vuln, groups)?.max_severity);

    if (Number.isFinite(groupScore)) {
        return groupScore;
    }

    for (const entry of vuln.severity || []) {
        const entryScore = Number(entry.score);

        if (Number.isFinite(entryScore)) {
            return entryScore;
        }
    }

    return null;
}

/**
 * Collects the alternative identifiers of a vulnerability.
 * A suppression entry may reference any of them, e.g. the CVE while the scanner reports the GHSA.
 * @param {Object} vuln The vulnerability as reported by osv-scanner.
 * @param {Object[]} groups The vulnerability groups of the package the vulnerability belongs to.
 * @returns {String[]} The aliases without the vulnerability's own id.
 */
export function getAliases (vuln, groups) {
    const aliases = new Set([
        ...vuln.aliases || [],
        ...findGroup(vuln, groups)?.aliases || []
    ]);

    aliases.delete(vuln.id);

    return [...aliases];
}

/**
 * Collects the findings of a single package into the given map.
 * A finding already present only gains the additional lock file path.
 * @param {Map} findingsByKey The collected findings, keyed by ecosystem, package, version and id.
 * @param {Object} pkg The package as reported by osv-scanner.
 * @param {String} source The lock file path the package was found in.
 * @returns {void}
 */
function collectPackageFindings (findingsByKey, pkg, source) {
    const packageName = pkg.package?.name || "unknown-package",
        ecosystem = pkg.package?.ecosystem || "unknown-ecosystem",
        version = pkg.package?.version || "unknown-version";

    for (const vuln of pkg.vulnerabilities || []) {
        const id = vuln.id || "unknown-id",
            findingKey = `${ecosystem}|${packageName}|${version}|${id}`,
            knownFinding = findingsByKey.get(findingKey);

        if (knownFinding) {
            if (!knownFinding.sources.includes(source)) {
                knownFinding.sources.push(source);
            }
        }
        else {
            findingsByKey.set(findingKey, {
                packageName,
                ecosystem,
                version,
                id,
                aliases: getAliases(vuln, pkg.groups),
                summary: vuln.summary || "",
                details: vuln.details || "",
                cvssScore: getCvssScore(vuln, pkg.groups),
                sources: [source]
            });
        }
    }
}

/**
 * Normalizes an osv-scanner result document into a flat list of findings.
 * A repository wide scan reports the same vulnerability once per lock file, so identical
 * findings are collected only once and the lock files are merged into their "sources".
 * @param {Object} osv The parsed osv-scanner output.
 * @returns {Object[]} The unique findings.
 */
export function normalizeFindings (osv) {
    const findingsByKey = new Map();

    for (const result of osv.results || []) {
        const source = result.source?.path || "unknown-source";

        for (const pkg of result.packages || []) {
            collectPackageFindings(findingsByKey, pkg, source);
        }
    }

    return [...findingsByKey.values()];
}
