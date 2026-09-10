import fs from "fs";

const suppressedStatuses = ["wont-fix", "false-positive", "accepted-risk"];
const knownStatuses = ["in-progress", "upstream-blocked"];
const validStatuses = [...suppressedStatuses, ...knownStatuses];
const requiredFields = ["id", "status", "reason", "addedBy", "addedOn", "reviewBy"];
const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/;
const maxReviewMonths = 12;

/**
 * Formats a date as "YYYY-MM-DD".
 * @param {Date} date The date to format.
 * @returns {String} The ISO date without a time part.
 */
function toIsoDate (date) {
    return date.toISOString().slice(0, 10);
}

/**
 * Shifts an ISO date by a number of months.
 * @param {String} isoDate A date as "YYYY-MM-DD".
 * @param {Number} months The number of months to add.
 * @returns {String} The shifted date as "YYYY-MM-DD".
 */
function addMonths (isoDate, months) {
    const date = new Date(`${isoDate}T00:00:00Z`);

    date.setUTCMonth(date.getUTCMonth() + months);

    return toIsoDate(date);
}

/**
 * Checks whether an entry addresses a finding, ignoring its review date.
 * Aliases are matched as well, because an entry may reference the CVE while the scanner
 * reports the GHSA identifier.
 * @param {Object} entry A suppression entry.
 * @param {Object} finding A normalized osv-scanner finding.
 * @returns {Boolean} True if the entry addresses the finding.
 */
function matchesFinding (entry, finding) {
    const identifiers = [finding.id, ...finding.aliases || []];

    if (!identifiers.includes(entry.id)) {
        return false;
    }
    if (entry.package && entry.package !== finding.packageName) {
        return false;
    }
    if (entry.ecosystem && entry.ecosystem !== finding.ecosystem) {
        return false;
    }

    return true;
}

/**
 * An entry stops suppressing on the day after its review date.
 * A missing or malformed review date counts as expired, so that findings resurface instead of
 * being hidden by an invalid entry.
 * @param {Object} entry A suppression entry.
 * @param {String} today The current date as "YYYY-MM-DD".
 * @returns {Boolean} True if the review date has passed.
 */
function isExpired (entry, today) {
    return !isoDatePattern.test(entry.reviewBy || "") || entry.reviewBy < today;
}

/**
 * Reads the suppression file.
 * A missing file yields an empty list, so the scan keeps working before the file exists.
 * @param {String} filePath Path to the suppression JSON file.
 * @returns {Object[]} The suppression entries.
 */
export function loadSuppressions (filePath) {
    if (!fs.existsSync(filePath)) {
        return [];
    }

    const document = JSON.parse(fs.readFileSync(filePath, "utf8"));

    if (!Array.isArray(document.entries)) {
        throw new Error(`${filePath} does not contain an "entries" array.`);
    }

    return document.entries;
}

/**
 * Checks the suppression entries against the rules of the concept.
 * @param {Object[]} entries The suppression entries.
 * @param {String} [today] The current date as "YYYY-MM-DD".
 * @returns {String[]} One message per violation, empty if everything is valid.
 */
export function validateSuppressions (entries, today = toIsoDate(new Date())) {
    const errors = [];
    const seenKeys = new Map();

    entries.forEach((entry, index) => {
        const label = `Entry ${index + 1} (${entry.id || "without id"})`;
        const key = `${entry.id}|${entry.package || "*"}|${entry.ecosystem || "*"}`;

        requiredFields.forEach(field => {
            if (!entry[field]) {
                errors.push(`${label}: "${field}" is required.`);
            }
        });

        if (entry.status && !validStatuses.includes(entry.status)) {
            errors.push(`${label}: unknown status "${entry.status}", expected one of ${validStatuses.join(", ")}.`);
        }

        if (entry.status === "in-progress" && !entry.ticket) {
            errors.push(`${label}: status "in-progress" requires a "ticket".`);
        }

        ["addedOn", "reviewBy"].forEach(field => {
            if (entry[field] && !isoDatePattern.test(entry[field])) {
                errors.push(`${label}: "${field}" must be a date in the format YYYY-MM-DD.`);
            }
        });

        if (isoDatePattern.test(entry.reviewBy || "") && entry.reviewBy > addMonths(today, maxReviewMonths)) {
            errors.push(`${label}: "reviewBy" must not be more than ${maxReviewMonths} months in the future.`);
        }

        if (seenKeys.has(key)) {
            errors.push(`${label}: duplicates entry ${seenKeys.get(key)}.`);
        }
        else {
            seenKeys.set(key, index + 1);
        }
    });

    return errors;
}

/**
 * Finds the suppression entry that addresses a finding.
 * Active entries take precedence, so an expired duplicate cannot mask a valid suppression.
 * @param {Object} finding A normalized osv-scanner finding.
 * @param {Object[]} entries The suppression entries.
 * @param {String} today The current date as "YYYY-MM-DD".
 * @returns {Object|null} An object holding "entry" and "expired", or null if nothing matches.
 */
export function findSuppression (finding, entries, today) {
    const matching = entries.filter(entry => matchesFinding(entry, finding));

    if (matching.length === 0) {
        return null;
    }

    const active = matching.find(entry => !isExpired(entry, today));

    return active
        ? {entry: active, expired: false}
        : {entry: matching[0], expired: true};
}

/**
 * Sorts findings into the report sections and detects entries that match nothing any more.
 * @param {Object[]} findings The normalized osv-scanner findings.
 * @param {Object[]} entries The suppression entries.
 * @param {String} today The current date as "YYYY-MM-DD".
 * @returns {Object} The sections "newFindings", "expired", "known", "suppressed" and "stale".
 */
export function classifyFindings (findings, entries, today) {
    const sections = {newFindings: [], expired: [], known: [], suppressed: [], stale: []};
    const matchedEntries = new Set();

    for (const finding of findings) {
        const match = findSuppression(finding, entries, today);

        if (match === null) {
            sections.newFindings.push(finding);
            continue;
        }

        matchedEntries.add(match.entry);

        const classified = {...finding, suppression: match.entry};

        if (match.expired) {
            sections.expired.push(classified);
        }
        else if (knownStatuses.includes(match.entry.status)) {
            sections.known.push(classified);
        }
        else {
            sections.suppressed.push(classified);
        }
    }

    sections.stale = entries.filter(entry => !matchedEntries.has(entry));

    return sections;
}
