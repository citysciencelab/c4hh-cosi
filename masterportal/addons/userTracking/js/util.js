import {trackMatomoEvent} from "./trackMatomo";

/**
 * Assembles an object with debugging information (function name and component name if available) for a tracking event.
 * @param {String} funcName The name of the function that triggered the event.
 * @param {String} [compName] The name of the component that triggered the event.
 * @returns {Object} An object containing "funcName" and "compName" if available.
 */
export function assembleSourceInfoForEvent (funcName, compName) {
    return compName ? {compName, funcName} : {funcName};
}

/**
 * Tracks a Matomo event for the Draw tool (category "Tool").
 * @param {String} action The Matomo action text describing what happened.
 * @param {Object} params The parameter object.
 * @param {String} params.funcName The name of the calling handler function, used as "_source".
 * @param {Number} [params.value] The numeric value to attach to the event, if any.
 * @param {String} [params.version] The draw tool version (e.g. "2026"), undefined for the legacy tool.
 * @returns {void}
 */
export function trackDrawToolEvent (action, {funcName, value, version}) {
    trackMatomoEvent({
        category: "Tool",
        action,
        name: getDrawToolNameFromVersion(version),
        ...value !== undefined ? {value} : {},
        _source: assembleSourceInfoForEvent(funcName)
    });
}

const drawToolEventTimeouts = new Map();

/**
 * Debounces (500 ms) a Matomo event for the Draw tool, keyed per calling handler function so that
 * concurrent debounced handlers (e.g. stroke width and text) do not cancel each other's pending timeouts.
 * @param {String} action The Matomo action text describing what happened.
 * @param {Object} params The parameter object.
 * @param {String} params.funcName The name of the calling handler function, used as debounce key and "_source".
 * @param {Number} [params.value] The numeric value to attach to the event, if any.
 * @param {String} [params.version] The draw tool version (e.g. "2026"), undefined for the legacy tool.
 * @returns {void}
 */
export function trackDrawToolEventDebounced (action, {funcName, value, version}) {
    if (drawToolEventTimeouts.has(funcName)) {
        clearTimeout(drawToolEventTimeouts.get(funcName));
    }

    drawToolEventTimeouts.set(funcName, setTimeout(() => {
        trackDrawToolEvent(action, {funcName, value, version});
        drawToolEventTimeouts.delete(funcName);
    }, 500));
}

/**
 * Converts an [r, g, b] array into a single packed integer (0xRRGGBB), as used for Matomo event values.
 * Throws error if the array does not have exactly 3 entries.
 * @param {Number[]} rgbArr The RGB array, e.g. [255, 0, 0].
 * @returns {Number} The packed color value.
 */
export function convertRgbArrayToPackedColorValue (rgbArr) {
    if (!Array.isArray(rgbArr) || rgbArr.length !== 3) {
        throw new Error(`${convertRgbArrayToPackedColorValue.name}: invalid rgb value`);
    }

    return (rgbArr[0] << 16) | (rgbArr[1] << 8) | rgbArr[2];
}

/**
 * Converts a comma-separated "r,g,b" string into a single packed integer (0xRRGGBB).
 * @param {String} rgbAsString The RGB string, e.g. "255,0,0".
 * @returns {Number} The packed color value.
 */
export function convertRgbStringToPackedColorValue (rgbAsString) {
    return convertRgbArrayToPackedColorValue(
        rgbAsString.split(",").map(value => parseInt(value, 10))
    );
}

/**
 * Converts a text string to a URI-compatible representation.
 * Replaces German umlauts (ä→ae, ö→oe, ü→ue, ß→ss), converts letters following a space to uppercase,
 * and removes all characters not permitted in an unencoded URI segment (keeps A–Z, a–z, 0–9, "/", "-", "_", ".", "~").
 * @param {String} text The input text to convert.
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
 * Builds the Matomo event "name" value identifying which Draw tool version was used.
 * @param {String} [version] The draw tool version (e.g. "2026"); undefined for the legacy tool.
 * @returns {String} "Draw (Old)" for the legacy tool, or "Draw ({version})" otherwise.
 */
export function getDrawToolNameFromVersion (version) {
    return version ? `Draw (${version})` : "Draw (Old)";
}

/**
 * Returns a formatted string with the layer name and ID for the given layer ID.
 * Falls back to "LayerId unknown" when no layerId is provided.
 * @param {String} layerId The ID of the layer to look up.
 * @param {Object} store The Vuex store.
 * @returns {String} A string of the form "Layer: <name> (id: <id>)".
 */
export function getLayerInformation (layerId, store) {
    return layerId ? `Layer: ${store.getters.layerConfigById(layerId)?.name} (id: ${layerId})` : "LayerId unknown";
}

/**
 * Returns the value of the "_source" property of the given payload,
 * or "unknown source" if the property is not present.
 * @param {Object} payload The action or mutation payload.
 * @returns {String} The source string.
 */
export function getSourceFromPayload (payload) {
    return payload._source ?? "unknown source";
}

/**
 * Returns a URL segment representing the currently active folder path in the layer selection tree.
 * Folder names are joined with "/" and converted to PascalCase (spaces removed, following letter capitalised).
 * Returns an empty string when no folder (other than root) is active.
 * @param {Object} store The Vuex store instance.
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
    if (payload === undefined || isArrayOrObject && typeof payload !== "object") {
        console.error(`The function "${funcName}" requires a payload${isArrayOrObject ? "-object" : ""}.`);
        return false;
    }

    return true;
}

/**
 * Removes the "body" query parameter from the given href URL.
 * Returns the original href unchanged when it contains no query string.
 * @param {String} href The URL to strip the "body" parameter from.
 * @returns {String} The URL without the "body" query parameter.
 */
export function stripBodyParameterFromHref (href) {
    const queryStart = href.indexOf("?");

    if (queryStart === -1) {
        return href;
    }

    const params = new URLSearchParams(href.slice(queryStart + 1));

    params.delete("body");

    const query = params.toString();

    return `${href.slice(0, queryStart)}${query ? `?${query}` : ""}`;
}
