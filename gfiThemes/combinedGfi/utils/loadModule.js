const moduleRegister = {};

/**
 * Loads a configured javascript module.
 * @param {string} modulePath - The path to the module.
 * @param {Response} existingResponse - An existing response if already fetched
 * @returns {Promise<Object>} The prepared module and the preparePrintRequest function
 * @throws {Error} If the module could not be loaded or the function not found
 */
export async function loadModule (modulePath) {
    if (moduleRegister[modulePath]) {
        return moduleRegister[modulePath];
    }

    const response = await fetch(modulePath),
        contentType = response.headers.get("content-type"),
        text = await response.text(),
        module = {exports: {}},
        exports = module.exports;

    if (!response.ok) {
        throw new Error(`Module "${modulePath} could not be loaded."`);
    }

    if (contentType?.includes("text/html") ||
        text.trim().startsWith("<!DOCTYPE") ||
        text.trim().startsWith("<html")) {
        throw new Error(`Received HTML instead of JavaScript from "${modulePath}".`);
    }

    if (!text.trim()) {
        throw new Error(`Received empty content from "${modulePath}".`);
    }

    // eslint-disable-next-line no-new-func
    new Function("module", "exports", text)(module, exports);

    if (!moduleRegister[modulePath]) {
        moduleRegister[modulePath] = typeof module.exports === "function"
            ? module.exports
            : {
                ...module.exports,
                ...exports
            };
    }

    return moduleRegister[modulePath];
}
