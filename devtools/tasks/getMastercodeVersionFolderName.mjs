import path from "path";
import {fileURLToPath} from "url";
import {execSync} from "child_process";
import dayjs from "dayjs";
import getStableVersionNumber from "./getStableVersionNumber.mjs";

/**
 * Executes the given command and returns the result.
 * @param {Object} cmd the command to execute
 * @param {String} cwd the path
 * @returns {String} the result
 */
function git (cmd, cwd) {
    try {
        return execSync(cmd, {cwd, encoding: "utf8", stdio: ["pipe"]}).trim();
    }
    catch {
        return "";
    }
}

/**
 * If version tag exists, it is returned. Else a string containing date and time and branch name is returned.
 * @returns {String} the dedicated version or name of the folder to create
 */
export default function getMastercodeVersionFolderName () {
    const filename = fileURLToPath(import.meta.url);
    const dirname = path.dirname(filename);
    const repoRoot = path.resolve(dirname, "../../");

    const stableVersionNumber = getStableVersionNumber();
    let folderName = stableVersionNumber,
        newCreatedHead = false;
    const tagRaw = git("git describe --tags --exact-match", repoRoot); // e.g. v3.13.0
    const tag = tagRaw ? tagRaw.replace(/^v/, "").replace(/\./g, "_") : "";
    const branch = git("git rev-parse --abbrev-ref HEAD", repoRoot);
    const long = git("git rev-parse --short HEAD", repoRoot);
    const normalizedBranch = branch === "HEAD" ? long : branch.replace(/^heads\/v/, "");// if worked with git clone ... --branch (new created head), branchname is e.g.: heads/v3.13.0
    const dateStr = git("git log -1 --format=%cd --date=format:'%Y-%m-%d__%H-%M-%S'", repoRoot).replace(/'/g, "");

    if (normalizedBranch.replaceAll(".", "_") === stableVersionNumber) {
        newCreatedHead = true;
    }
    if (!newCreatedHead && (stableVersionNumber !== tag || !normalizedBranch.includes(long))) {
        const gitLastCommitDate = dateStr || dayjs().format("YYYY-MM-DD__HH-mm-ss");

        folderName += `_${normalizedBranch}_git_last_commit_at_${gitLastCommitDate}`;
    }

    return folderName.replace(/[\s:]+/g, "").replace(/#/g, "");
}
