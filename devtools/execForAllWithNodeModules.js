import {execSync} from "child_process";
import path from "path";
import {fileURLToPath} from "url";
import {walk} from "../../devtools/tasks/utils.js";

const __filename = fileURLToPath(import.meta.url),
    __dirname = path.dirname(__filename);


/**
 * Calls cmd for all package.json files in the addons folder.
 * @returns {void}
 */
function execCmdForAllNodeModules (cmd, logInfo) {
    const addonsDir = path.resolve(__dirname, "../"),
        files = walk(addonsDir).filter(file => path.basename(file) === "package.json" && file.indexOf(`${path.sep}node_modules${path.sep}`) === -1 && file.indexOf(`${path.sep}addons${path.sep}package.json`) === -1);

    for (let index = 0; index < files.length; index++) {
        const dirname = path.dirname(files[index]);

        execCmd(cmd, logInfo, dirname);
    }
}

/**
 *  Calls 'cmd in the given directory.
 * @param {String} dirname name of the directory
 * @param {boolean} lastOne if true, last file
 * @returns {void}
 */
function execCmd (cmd, logInfo, dirname) {
    try {
        console.warn("------------------------------------------------------------------------------------\n");
        console.warn(`Will execute ${cmd} in dir ${dirname}`);
        const stdout = execSync(`cd ${dirname} && ${cmd}`, {encoding: "utf8"});

        console.warn(logInfo, stdout);
    }
    catch (err) {
        console.error(`❌ failed in ${dirname}: ${err.message}`);
    }
}


process.on("unhandledRejection", function (error) {
    throw new Error(error);
});

export {
    execCmdForAllNodeModules
};


