import {rawLayerList} from "@masterportal/masterportalapi/src/index.js";
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
 * @param {String} [params.version] The draw tool version (e.g. "2026"), undefined for the legacy tool.
 * @returns {void}
 */
export function trackDrawToolEvent (action, {funcName, version}) {
    trackMatomoEvent({
        category: "Tool",
        action,
        name: getDrawToolNameFromVersion(version),
        _source: assembleSourceInfoForEvent(funcName)
    });
}

const drawToolEventTimeouts = new Map();

/**
 * Debounces (500 ms) a Matomo event for the Draw tool, keyed per calling handler function so that
 * concurrent debounced handlers (e.g. stroke width and text) do not cancel each other's pending timeouts.
 * @param {String} action The Matomo action text describing what happened.
 * @param {Object} params The parameter object.
 * @param {String} params.funcName The name of the calling handler function, used as "_source" and, unless "debounceKey" is given, as debounce key.
 * @param {String} [params.debounceKey] Overrides the debounce key, e.g. to keep events of one handler that happen together apart (fill and stroke color).
 * @param {String} [params.version] The draw tool version (e.g. "2026"), undefined for the legacy tool.
 * @returns {void}
 */
export function trackDrawToolEventDebounced (action, {funcName, debounceKey = funcName, version}) {
    if (drawToolEventTimeouts.has(debounceKey)) {
        clearTimeout(drawToolEventTimeouts.get(debounceKey));
    }

    drawToolEventTimeouts.set(debounceKey, setTimeout(() => {
        trackDrawToolEvent(action, {funcName, version});
        drawToolEventTimeouts.delete(debounceKey);
    }, 500));
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
    return `${window.location.origin}${getLowerCasedPathname()}`;
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
 * The name is taken from the layer configuration, or from the raw layer list if the layer is not configured in the config.json.
 * Falls back to "LayerId unknown" when no layerId is provided and to "Layer-name unknown" when no layer name is provided.
 * @param {String} layerId The ID of the layer to look up.
 * @param {Object} store The Vuex store.
 * @returns {String} A string of the form "Layer: <name> (id: <id>)".
 */
export function getLayerInformation (layerId, store) {
    if (!layerId) {
        return "LayerId unknown";
    }

    return `Layer: ${
        store.getters.layerConfigById(layerId)?.name
        ?? rawLayerList.getLayerWhere({id: layerId})?.name
        ?? "Layer-name unknown"
    } (id: ${layerId})`;
}

/**
 * Returns the location.pathname as lowercase string
 * @returns {String} The location.pathname as lowercase string
 */
export function getLowerCasedPathname () {
    return window.location.pathname.toLowerCase();
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

/**
 * Removes the values of all query parameters, so only the parameter names remain (e.g. "LAYERS=")
 * which are then sorted alphabetically.
 * Exception: for parameters listed in "searchParamKeysToKeep" the configured keys of their JSON value are kept.
 * @param {String} search The query string (with or without leading "?").
 * @param {Object} [keep] The parts of JSON-values to be kept in the query (e. g. {maps: ["mode"]})
 * @returns {String} The anonymized query string with leading "?", or "" if there are no parameters.
 */
export function anonymizeSearchParams (search, keep) {
    const keyValuePairs = [];

    new URLSearchParams(search).forEach((value, key) => {
        keyValuePairs.push([key, getReducedSearchParamValue(key, value, keep)]);
    });

    keyValuePairs.sort((a, b) => a[0].localeCompare(b[0]));

    return keyValuePairs.length > 0
        ? `?${keyValuePairs.map(pair => `${pair[0]}=${pair[1]}`).join("&")}`
        : "";
}

/**
 * Reduces a query parameter value to the keys configured in "searchParamKeysToKeep".
 * @param {String} key The query parameter name.
 * @param {String} value The decoded query parameter value.
 * @param {Object} [keep] The parts of JSON-values to be kept in the query (e. g. {maps: ["mode"]})
 * @returns {String} The reduced JSON string, or "" if nothing is to be kept or the value is no valid JSON object.
 */
function getReducedSearchParamValue (key, value, keep) {
    const funcName = "getReducedSearchParamValue";
    const keysToKeep = keep ? keep[key.toLowerCase()] : undefined;

    if (!keysToKeep) {
        return "";
    }

    try {
        const parsed = JSON.parse(value),
            reduced = {};

        keysToKeep.forEach(keyToKeep => {
            if (parsed?.[keyToKeep] !== undefined) {
                reduced[keyToKeep] = parsed[keyToKeep];
            }
        });

        return Object.keys(reduced).length > 0 ? JSON.stringify(reduced) : "";
    }
    catch (error) {
        console.warn(`${funcName}: could not parse query parameter value`);
        return "";
    }
}
