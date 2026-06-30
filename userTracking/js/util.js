/**
 * Converts a text string to a URI-compatible representation.
 * Replaces German umlauts (ä→ae, ö→oe, ü→ue, ß→ss), converts letters following a space to uppercase,
 * and removes all characters not permitted in an unencoded URI segment (keeps A–Z, a–z, 0–9, "/", "-", "_", ".", "~").
 * @param {String} text - The input text to convert.
 * @returns {String} The URI-compatible string.
 */
export function convertToUriCompatible (text) {
    return text.replace(/ä/g, "ae").replace(/Ä/g, "Ae")
        .replace(/ö/g, "oe").replace(/Ö/g, "Oe")
        .replace(/ü/g, "ue").replace(/Ü/g, "Ue")
        .replace(/ß/g, "ss")
        .replace(/\s\p{L}/gu, c => c.toUpperCase())
        .replace(/[^A-Za-z0-9/\-_.~]/g, "");
}

/**
 * Returns the base URL of the current page, consisting of origin and pathname without query string or fragment.
 * @returns {String} The base URL (e.g. "https://localhost:9001/portal/master").
 */
export function getBaseUrl () {
    return `${window.location.origin}${window.location.pathname}`;
}

/**
 * Returns a URL segment representing the currently active folder path in the layer selection tree.
 * Folder names are joined with "/" and converted to PascalCase (spaces removed, following letter capitalised).
 * Returns an empty string when no folder (other than root) is active.
 * @param {Object} store - The Vuex store instance.
 * @returns {String} The URL segment (e.g. "/Emissionen/Starkregen") or "" if no folder is selected.
 */
export function getLayerSelectionUrlSegement (store) {
    const lastFolderNames = (store.getters["Modules/LayerSelection/lastFolderNames"] ?? [])
        .filter((folderName) => folderName !== "root");

    return lastFolderNames.length > 0
        ? `/${convertToUriCompatible(lastFolderNames.join("/"))}`
        : "";
}

/**
 * Validates that a payload is present and, if required, is an array or object.
 * Logs a console error and returns false when validation fails.
 * @param {Object} params The parameter object.
 * @param {String} params.funcName The name of the calling function, used in the error message.
 * @param {Boolean} [params.isArrayOrObject=true] When true, also checks that the payload is of type "object".
 * @param {*} params.payload The payload value to validate.
 * @returns {Boolean} true if the payload is valid, false otherwise.
 */
export function isPayloadValid ({funcName, isArrayOrObject = true, payload}) {
    if (!payload || isArrayOrObject && typeof payload !== "object") {
        console.error(`The function "${funcName}" requires a payload${isArrayOrObject ? "-object" : ""}.`);
        return false;
    }

    return true;
}
