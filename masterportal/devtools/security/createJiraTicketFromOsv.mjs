import fs from "fs";
import {fileURLToPath} from "url";
import {normalizeFindings} from "./osvFindings.mjs";
import {classifyFindings, loadSuppressions} from "./osvSuppressions.mjs";

const jiraBaseUrl = process.env.JIRA_BASE_URL;
const jiraUserEmail = "ahmed.alqassass@gv.hamburg.de";
const jiraApiToken = process.env.JIRA_API_TOKEN;
const jiraProjectKey = process.env.JIRA_PROJECT_KEY;
const jiraIssueType = process.env.JIRA_ISSUE_TYPE || "Task";
const bitbucketRepoFullName = process.env.BITBUCKET_REPO_FULL_NAME || "unknown-repo";
const bitbucketBranch = process.env.BITBUCKET_BRANCH || "unknown-branch";
const bitbucketCommit = process.env.BITBUCKET_COMMIT || "unknown-commit";
const bitbucketBuildNumber = process.env.BITBUCKET_BUILD_NUMBER || "unknown-build";
const buildContext = `${bitbucketRepoFullName} | branch ${bitbucketBranch} | commit ${bitbucketCommit} | build ${bitbucketBuildNumber}`;

// Renders the ticket and skips the Jira request, so no Jira credentials are required.
const dryRun = ["1", "true"].includes((process.env.OSV_DRY_RUN || "").toLowerCase());

if (!dryRun && (!jiraBaseUrl || !jiraUserEmail || !jiraApiToken || !jiraProjectKey)) {
    console.error("Missing required Jira environment variables.");
    process.exit(1);
}

const filePath = "./osv-result.json";

if (!fs.existsSync(filePath)) {
    console.log("osv-result.json not found. Nothing to do.");
    process.exit(0);
}

const raw = fs.readFileSync(filePath, "utf8");
let osv;

try {
    osv = JSON.parse(raw);
}
catch (error) {
    console.error(`${filePath} is not valid JSON, the scan probably did not finish.`);
    console.error(error.message);
    process.exit(1);
}

const findings = normalizeFindings(osv);

console.log(`Total unique vulnerabilities found: ${findings.length}`);

if (findings.length === 0) {
    console.log("No vulnerabilities found. No Jira ticket will be created.");
    process.exit(0);
}

// Filter vulnerabilities based on the minimum CVSS score
// required for automatic Jira ticket creation.
//
// Common values:
// 0 => all vulnerabilities
// 4 => MEDIUM + HIGH + CRITICAL vulnerabilities
// 7 => HIGH + CRITICAL vulnerabilities
// 9 => only CRITICAL vulnerabilities
const minCvssScore = Number(process.env.OSV_MIN_CVSS_SCORE || 4);

// Findings without a known score are always reported, so that they are not silently dropped.
const relevantFindings = findings.filter(f => f.cvssScore === null || f.cvssScore >= minCvssScore);

if (relevantFindings.length === 0) {
    console.log(
        `No vulnerabilities found above CVSS ${minCvssScore}. No Jira ticket will be created.`
    );
    process.exit(0);
}

// The suppression file lives next to this script, while osv-result.json is read from the cwd.
const suppressionsPath = fileURLToPath(new URL("./osvSuppressions.json", import.meta.url));
const today = new Date().toISOString().slice(0, 10);
const classified = classifyFindings(relevantFindings, loadSuppressions(suppressionsPath), today);

const maxSectionEntries = 50;
const maxPkg = Math.max(...relevantFindings.map(f => f.packageName.length));
const maxId = Math.max(...relevantFindings.map(f => f.id.length));
const maxIdx = String(relevantFindings.length).length + 1;

/**
 * Caps a section, because Jira rejects oversized descriptions.
 * @param {String[]} lines The rendered lines of a section.
 * @param {Number} total The number of entries before truncation.
 * @returns {String[]} The lines, with a truncation note or a placeholder for empty sections.
 */
function withSectionLimit (lines, total) {
    if (total === 0) {
        return ["none"];
    }
    if (total > lines.length) {
        return [...lines, `… and ${total - lines.length} more`];
    }

    return lines;
}

/**
 * Renders findings as aligned text lines.
 * @param {Object[]} sectionFindings The findings of one report section.
 * @returns {String[]} One line per finding.
 */
function formatFindings (sectionFindings) {
    const lines = sectionFindings.slice(0, maxSectionEntries).map((f, index) => {
        const num = `${index + 1}.`.padEnd(maxIdx + 1);
        const pkg = f.packageName.padEnd(maxPkg);
        const cvss = `CVSS:${f.cvssScore === null ? "n/a" : f.cvssScore}`.padEnd(8);
        const id = f.id.padEnd(maxId);
        const ticket = f.suppression?.ticket ? ` | ${f.suppression.ticket}` : "";

        return `${num} ${pkg} | ${cvss} | ${id}${ticket} | ${f.summary}`;
    });

    return withSectionLimit(lines, sectionFindings.length);
}

/**
 * Renders suppressed findings as identifiers only, so that decided cases stay visible but quiet.
 * @param {Object[]} sectionFindings The findings of one report section.
 * @returns {String[]} One line per finding.
 */
function formatSuppressed (sectionFindings) {
    const lines = sectionFindings
        .slice(0, maxSectionEntries)
        .map(f => `${f.id.padEnd(maxId)} | ${f.packageName.padEnd(maxPkg)} | ${f.suppression.status}`);

    return withSectionLimit(lines, sectionFindings.length);
}

/**
 * Renders suppression entries that no longer match any finding.
 * @param {Object[]} entries The stale suppression entries.
 * @returns {String[]} One line per entry.
 */
function formatStale (entries) {
    const lines = entries
        .slice(0, maxSectionEntries)
        .map(entry => `${entry.id} | ${entry.package || "any package"} | ${entry.status}`);

    return withSectionLimit(lines, entries.length);
}

const reportSections = [
    {title: `NEW (${classified.newFindings.length})`, lines: formatFindings(classified.newFindings)},
    {title: `EXPIRED REVIEW (${classified.expired.length})`, lines: formatFindings(classified.expired)},
    {title: `KNOWN / IN PROGRESS (${classified.known.length})`, lines: formatFindings(classified.known)},
    {title: `SUPPRESSED (${classified.suppressed.length})`, lines: formatSuppressed(classified.suppressed)},
    {title: `STALE ENTRIES (${classified.stale.length})`, lines: formatStale(classified.stale)}
];

console.log(`Report for findings above CVSS ${minCvssScore}:`);
console.log(buildContext);

reportSections.forEach(section => {
    console.log(`\n${section.title}`);
    section.lines.forEach(line => console.log(line));
});

// Everything else is already triaged, so a ticket would only repeat the previous week.
const actionableCount = classified.newFindings.length + classified.expired.length;

if (actionableCount === 0) {
    console.log("\nNo new findings and no expired suppressions. No Jira ticket will be created.");
    process.exit(0);
}

const summary = `OSV weekly: ${classified.newFindings.length} new, ${classified.expired.length} expired review, ${classified.known.length} known`;

const descriptionContent = [
    ...reportSections.flatMap(section => [
        {
            type: "heading",
            attrs: {level: 3},
            content: [{type: "text", text: section.title}]
        },
        {
            type: "codeBlock",
            attrs: {language: "text"},
            content: [{type: "text", text: section.lines.join("\n")}]
        }
    ]),
    {
        type: "paragraph",
        content: [{type: "text", text: buildContext}]
    }
];

const body = {
    fields: {
        project: {
            key: jiraProjectKey
        },
        summary,
        issuetype: {
            name: jiraIssueType
        },
        description: {
            type: "doc",
            version: 1,
            content: descriptionContent
        },
        labels: ["security", "osv", "automated"]
    }
};

if (dryRun) {
    console.log("Dry run: no Jira issue will be created. Request body:");
    console.log(JSON.stringify(body, null, 2));
    process.exit(0);
}

let response;

const auth = Buffer.from(`${jiraUserEmail}:${jiraApiToken}`).toString("base64");

try {
    response = await fetch(`${jiraBaseUrl}/rest/api/3/issue`, {
        method: "POST",
        headers: {
            "Authorization": `Basic ${auth}`,
            "Accept": "application/json",
            "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
    });
}
catch (error) {
    console.error("Failed to reach Jira.");
    console.error(error.cause?.message || error.message);
    process.exit(1);
}

const responseText = await response.text();

if (!response.ok) {
    console.error("Failed to create Jira issue.");
    console.error(response.status, responseText);
    process.exit(1);
}

console.log("Jira issue created successfully.");
console.log(responseText);
