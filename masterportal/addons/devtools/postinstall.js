import {execCmdForAllNodeModules} from "./execForAllWithNodeModules.js";

/**
 * Calls 'npm install' for all package.json files in the addons folder.
 * @returns {void}
 */
function installPackageJsonFiles () {
    execCmdForAllNodeModules("npm install", "> npm install\n");
}

installPackageJsonFiles();

