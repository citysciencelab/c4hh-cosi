import {execCmdForAllNodeModules} from "./execForAllWithNodeModules.js";

/**
 * Calls 'rimraf node_modules' for all node_modules folders in the addons folder.
 * @returns {void}
 */
function deleteNodeModules () {
    execCmdForAllNodeModules("rimraf node_modules", "> delete node_modules\n");
}

deleteNodeModules();

