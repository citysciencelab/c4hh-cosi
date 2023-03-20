export default {
    /**
     *
     * @param {string} toolName name of the requested tool as a character string
     * @param {*} settings as received from toolBridgeOut getter in requested tool
     * @param {function} outputCallback function to be called on the tools returned result
<<<<<<< HEAD
     * @param {boolean} updateInterfaceOnly only update the interface, don't actually apply the analysis itself (may or may not be supported by individual tools)
     * @return {*} function called for side effects only.
     */
    runTool ({commit, getters}, {toolName, settings, outputCallback, updateInterfaceOnly}) {
=======
     * @return {*} function called for side effects only.
     */
    runTool ({commit, getters}, {toolName, settings, outputCallback}) {
>>>>>>> a3a39d38 (add new addons_3_0_0 structure-add missing addons)
        // here we only check if the requested tool is supported, then pass the request to the tool's store.
        // the requested tool itself should have a watcher that does the rest (run the analysis based on the settings and commits the results back to the toolBridge' store shelf.)
        // validate inputs
        if (!getters.supportedTools.includes(toolName)) {
            throw new Error(toolName + " not supported");
        }
        if (typeof outputCallback !== "function") {
            throw new Error(outputCallback + " must be a function");
        }
<<<<<<< HEAD
        // assert settings to be an object and not null
        if (typeof settings !== "object" || settings === null) {
            throw new Error(settings + " must be an object");
        }
        // assert updateInterfaceOnly to be a boolean or undefined
        if (typeof updateInterfaceOnly !== "undefined" && typeof updateInterfaceOnly !== "boolean") {
            throw new Error(updateInterfaceOnly + " must be a boolean or undefined");
        }

        // eslint-disable-next-line one-var
        const toolPath = "Tools/" + toolName + "/setToolBridgeIn",
            request = {
                settings: settings,
                outputCallback: outputCallback
            };

        if (updateInterfaceOnly) {
            request.updateInterfaceOnly = updateInterfaceOnly;
        }
        commit(
            toolPath,
            request,
=======
        // commit request to the requested tool
        const toolPath = "Tools/" + toolName + "/setToolBridgeIn";

        commit(
            toolPath,
            {
                settings: settings,
                outputCallback: outputCallback
            },
>>>>>>> a3a39d38 (add new addons_3_0_0 structure-add missing addons)
            {root: true} // allows commit to a different module
        );
    }
};
