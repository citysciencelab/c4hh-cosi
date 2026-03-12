import path from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";
import dayjs from "dayjs";
import getStableVersionNumber from "./getStableVersionNumber.mjs";

function git(cmd, cwd) {
    try {
        return execSync(cmd, { cwd, encoding: "utf8" }).trim();
    } catch {
        return "";
    }
}

export default function getMastercodeVersionFolderName() {
    const filename = fileURLToPath(import.meta.url);
    const dirname = path.dirname(filename);
    const repoRoot = path.resolve(dirname, "../../");

    const stableVersionNumber = getStableVersionNumber();
    let folderName = stableVersionNumber;

    //  gitRevSync
    const tagRaw = git("git describe --tags --exact-match", repoRoot); // e.g. v3.13.0
    const tag = tagRaw ? tagRaw.replace(/^v/, "").replace(/\./g, "_") : "";
    const branch = git("git rev-parse --abbrev-ref HEAD", repoRoot);
    const long = git("git rev-parse --short HEAD", repoRoot);
    const normalizedBranch = branch === "HEAD" ? long : branch;
    const dateStr = git("git log -1 --format=%cd --date=format:'%Y-%m-%d__%H-%M-%S'", repoRoot).replace(/'/g, "");
    if (stableVersionNumber !== tag || !normalizedBranch.includes(long)) {
        const gitLastCommitDate = dateStr || dayjs().format("YYYY-MM-DD__HH-mm-ss");
        folderName += `_${normalizedBranch}_git_last_commit_at_${gitLastCommitDate}`;
    }

    return folderName.replace(/[\s:]+/g, "").replace(/#/g, "");
}