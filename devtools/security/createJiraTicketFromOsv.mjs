/* eslint-disable */
import fs from "fs";

const jiraBaseUrl = process.env.JIRA_BASE_URL;
const jiraUserEmail = "ahmed.alqassass@gv.hamburg.de";
const jiraApiToken = process.env.JIRA_API_TOKEN;
const jiraProjectKey = process.env.JIRA_PROJECT_KEY;
const jiraIssueType = process.env.JIRA_ISSUE_TYPE || "Task";
const bitbucketRepoFullName = process.env.BITBUCKET_REPO_FULL_NAME || "unknown-repo";
const bitbucketBranch = process.env.BITBUCKET_BRANCH || "unknown-branch";
const bitbucketCommit = process.env.BITBUCKET_COMMIT || "unknown-commit";
const bitbucketBuildNumber = process.env.BITBUCKET_BUILD_NUMBER || "unknown-build";

if (!jiraBaseUrl || !jiraUserEmail || !jiraApiToken || !jiraProjectKey) {
    console.error("Missing required Jira environment variables.");
    process.exit(1);
}

const filePath = "./osv-result.json";

if (!fs.existsSync(filePath)) {
    console.log("osv-result.json not found. Nothing to do.");
    process.exit(0);
}

const raw = fs.readFileSync(filePath, "utf8");
const osv = JSON.parse(raw);

const findings = [];

/**
 * Tries to normalize OSV scan results into a flat array.
 */
for (const result of osv.results || []) {
    for (const pkg of result.packages || []) {
        for (const vuln of pkg.vulnerabilities || []) {
            findings.push({
                packageName: pkg.package?.name || "unknown-package",
                ecosystem: pkg.package?.ecosystem || "unknown-ecosystem",
                id: vuln.id || "unknown-id",
                summary: vuln.summary || "",
                details: vuln.details || "",
                severity: Array.isArray(vuln.severity) && vuln.severity.length > 0
                    ? vuln.severity.map(s => `${s.type}:${s.score}`).join(", ")
                    : "unknown"
            });
        }
    }
}

console.log(`Total vulnerabilities found: ${findings.length}`);

// If your osv-scanner output shape differs, adapt parsing here.
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

const relevantFindings = findings.filter(f => {
    const severity = (f.severity || "").toUpperCase();

    const scores = [...severity.matchAll(/(\d+(?:\.\d+)?)/g)]
        .map(match => Number(match[1]));

    f.cvssScore = Math.max(...scores, 0);

    return scores.length === 0 || f.cvssScore >= minCvssScore;
});

if (relevantFindings.length === 0) {
    console.log(
        `No vulnerabilities found above CVSS ${minCvssScore}. No Jira ticket will be created.`
    );
    process.exit(0);
}

console.log(`Relevant findings above CVSS ${minCvssScore}:`);

const maxPkg = Math.max(...relevantFindings.map(f => f.packageName.length));
const maxId = Math.max(...relevantFindings.map(f => f.id.length));
const maxIdx = String(relevantFindings.length).length + 1;

const formattedFindingLines = relevantFindings.map((f, index) => {
    const num = `${index + 1}.`.padEnd(maxIdx + 1);
    const pkg = f.packageName.padEnd(maxPkg);
    const cvss = `CVSS:${f.cvssScore}`.padEnd(8);
    const id = f.id.padEnd(maxId);

    return `${num} ${pkg} | ${cvss} | ${id} | ${f.summary}`;
});

formattedFindingLines.forEach(line => console.log(line));


const highestCount = relevantFindings.length;

const summary = `${highestCount} findings above CVSS ${minCvssScore}`;

const description = [
    `Relevant findings above CVSS ${minCvssScore}:`,
    ...formattedFindingLines
].join("\n");

const auth = Buffer.from(`${jiraUserEmail}:${jiraApiToken}`).toString("base64");

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
            content: [
                {
                    type: "codeBlock",
                    attrs: {
                        language: "text"
                    },
                    content: [{
                        type: "text",
                        text: description
                    }]
                }
            ]
        },
        labels: ["security", "osv", "automated"]
    }
};

const response = await fetch(`${jiraBaseUrl}/rest/api/3/issue`, {
    method: "POST",
    headers: {
        "Authorization": `Basic ${auth}`,
        "Accept": "application/json",
        "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
});

const responseText = await response.text();

if (!response.ok) {
    console.error("Failed to create Jira issue.");
    console.error(response.status, responseText);
    process.exit(1);
}

console.log("Jira issue created successfully.");
console.log(responseText);
