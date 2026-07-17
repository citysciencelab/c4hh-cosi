import detectServiceType from "./detectServiceType.js";
import handleWmsFromCsw from "./handleWmsFromCsw.js";
import handleWmtsFromCsw from "./handleWmtsFromCsw.js";
import handleWfsFromCsw from "./handleWfsFromCsw.js";
import handleOafFromCsw from "./handleOafFromCsw.js";
import buildServiceLayerEntries from "./buildServiceLayerEntries.js";

/**
 * Normalizes OAF URLs from CSW records.
 * CSW links often point to /collections/{id} or /collections/{id}/items instead of API root.
 * @param {String} urlOrBaseUrl Parsed resource URL or base URL.
 * @returns {{baseUrl: String, collection: String}} Normalized API base URL and detected collection name.
 */
export function normalizeOafUrl (urlOrBaseUrl = "") {
    try {
        const parsedUrl = new URL(urlOrBaseUrl);
        const pathSegments = parsedUrl.pathname.split("/").filter(Boolean);
        const collectionsIndex = pathSegments.findIndex(segment => segment.toLowerCase() === "collections");
        let collection = "";

        if (collectionsIndex !== -1) {
            if (pathSegments.length > collectionsIndex + 1) {
                collection = decodeURIComponent(pathSegments[collectionsIndex + 1]);
            }
            parsedUrl.pathname = `/${pathSegments.slice(0, collectionsIndex).join("/")}`;
        }
        parsedUrl.search = "";
        parsedUrl.hash = "";

        return {
            baseUrl: parsedUrl.toString().replace(/\/$/, ""),
            collection
        };
    }
    catch (error) {
        return {
            baseUrl: urlOrBaseUrl,
            collection: ""
        };
    }
}

/**
 * Resolves WMS data from CSW records.
 * @param {String} baseUrl The WMS base URL.
 * @returns {Promise<Object>} Service specific state.
 */
export async function resolveWms (baseUrl) {
    const wmsConfig = await handleWmsFromCsw(baseUrl),
        result = {
            serviceUnavailable: wmsConfig.serviceUnavailable,
            serviceTitle: wmsConfig.serviceTitle || "",
            discoveredLayerEntries: []
        };

    if (wmsConfig.layersAdded) {
        result.discoveredLayerEntries = buildServiceLayerEntries("WMS", wmsConfig.layerTitleEntries || []);
    }

    return result;
}

/**
 * Resolves WFS data from CSW records.
 * @param {String} baseUrl The WFS base URL.
 * @param {String} effectiveLayerName The already derived layer name.
 * @returns {Promise<Object>} Service specific state.
 */
export async function resolveWfs (baseUrl, effectiveLayerName) {
    const wfsConfig = await handleWfsFromCsw(baseUrl),
        featureTypes = wfsConfig.featureTypes || [],
        result = {
            serviceUnavailable: wfsConfig.serviceUnavailable,
            serviceTitle: wfsConfig.serviceTitle || "",
            wfsVersion: wfsConfig.wfsVersion,
            wfsOutputFormat: wfsConfig.wfsOutputFormat,
            wfsFeatureNS: "",
            discoveredLayerEntries: [],
            effectiveLayerName
        };

    let featureTypesWithTitles = featureTypes;

    if (wfsConfig.featureTypeTitles && Array.isArray(wfsConfig.featureTypeTitles)) {
        featureTypesWithTitles = featureTypes.map(ft => {
            const titleObj = wfsConfig.featureTypeTitles.find(t => t.name === ft.name);

            return titleObj ? {...ft, title: titleObj.title} : ft;
        });
    }

    if (!effectiveLayerName) {
        result.discoveredLayerEntries = buildServiceLayerEntries("WFS", featureTypesWithTitles);
    }
    else {
        const match = featureTypesWithTitles.find(entry => entry.name === effectiveLayerName) || featureTypesWithTitles[0];

        result.effectiveLayerName = match?.name || effectiveLayerName;
        result.wfsFeatureNS = match?.featureNS || "";
    }

    return result;
}

/**
 * Resolves WMTS data from CSW records.
 * @param {String} baseUrl The WMTS base URL.
 * @param {String} effectiveLayerName The already derived layer name.
 * @returns {Promise<Object>} Service specific state.
 */
export async function resolveWmts (baseUrl, effectiveLayerName) {
    const wmtsConfig = await handleWmtsFromCsw(baseUrl),
        layers = wmtsConfig.layerTitleEntries || [],
        result = {
            serviceUnavailable: wmtsConfig.serviceUnavailable,
            serviceTitle: wmtsConfig.serviceTitle || "",
            wmtsCapabilitiesUrl: wmtsConfig.capabilitiesUrl || "",
            wmtsFormat: "",
            wmtsTileMatrixSet: "",
            discoveredLayerEntries: [],
            effectiveLayerName
        };

    if (!effectiveLayerName) {
        result.discoveredLayerEntries = buildServiceLayerEntries("WMTS", layers);
    }
    else {
        const match = layers.find(entry => entry.name === effectiveLayerName) || layers[0];

        result.effectiveLayerName = match?.name || effectiveLayerName;
        result.wmtsFormat = match?.format || "";
        result.wmtsTileMatrixSet = match?.tileMatrixSet || "";
    }

    return result;
}

/**
 * Resolves OAF data from CSW records.
 * @param {String} url Parsed OAF resource URL.
 * @param {String} baseUrl Parsed OAF base URL.
 * @param {String} effectiveLayerName The already derived layer name.
 * @returns {Promise<Object>} Service specific state.
 */
export async function resolveOaf (url, baseUrl, effectiveLayerName) {
    const normalizedOafUrl = normalizeOafUrl(url || baseUrl),
        oafConfig = await handleOafFromCsw(normalizedOafUrl.baseUrl || baseUrl),
        result = {
            serviceUnavailable: oafConfig.serviceUnavailable,
            serviceTitle: oafConfig.serviceTitle || "",
            baseUrl: normalizedOafUrl.baseUrl || baseUrl,
            discoveredLayerEntries: [],
            effectiveLayerName: effectiveLayerName || ""
        };

    if (!result.effectiveLayerName && normalizedOafUrl.collection) {
        result.effectiveLayerName = normalizedOafUrl.collection;
    }

    if (oafConfig.layersAdded) {
        result.discoveredLayerEntries = buildServiceLayerEntries("OAF", oafConfig.layerTitleEntries || []);
    }

    return result;
}

/**
 * Resolves service specific config for one parsed CSW online resource.
 * @param {Object} parsedResource Parsed resource returned by parseCswOnlineResource.
 * @param {String} parsedResource.protocol Resource protocol.
 * @param {String} parsedResource.url Resource URL.
 * @param {String} parsedResource.layerName Layer name from metadata.
 * @param {String} parsedResource.urlLayerParam LAYERS query param from URL.
 * @param {String} parsedResource.baseUrl Service base URL.
 * @returns {Promise<Object>} Resolved service configuration.
 */
export default async function resolveCswServiceConfig (parsedResource) {
    const {protocol, url, layerName, urlLayerParam, baseUrl} = parsedResource;
    const typ = detectServiceType(protocol, url);
    let effectiveBaseUrl = baseUrl;
    const OGC_OPERATIONS = ["getcapabilities", "getmap", "getfeature", "gettile", "getlegendgraphic", "getfeatureinfo"],
        technicalLayerName = layerName
            && !layerName.includes(" ")
            && !OGC_OPERATIONS.includes(layerName.replace(/[()]/g, "").trim().toLowerCase())
            ? layerName : "";
    let effectiveLayerName = technicalLayerName || urlLayerParam;
    let wfsVersion = "1.1.0";
    let wfsOutputFormat = "XML";
    let wfsFeatureNS = "";
    let wmtsCapabilitiesUrl = "";
    let wmtsFormat = "";
    let wmtsTileMatrixSet = "";
    let serviceUnavailable = false;
    let serviceTitle = "";
    let discoveredLayerEntries = [];

    if (!typ) {
        return {
            typ,
            baseUrl: effectiveBaseUrl,
            effectiveLayerName,
            wfsVersion,
            wfsOutputFormat,
            wfsFeatureNS,
            wmtsCapabilitiesUrl,
            wmtsFormat,
            wmtsTileMatrixSet,
            serviceUnavailable,
            serviceTitle,
            discoveredLayerEntries
        };
    }

    if (typ === "WMS" && !effectiveLayerName) {
        ({serviceUnavailable, serviceTitle, discoveredLayerEntries} = await resolveWms(baseUrl));
    }
    else if (typ === "WFS") {
        ({
            serviceUnavailable,
            serviceTitle,
            wfsVersion,
            wfsOutputFormat,
            wfsFeatureNS,
            discoveredLayerEntries,
            effectiveLayerName
        } = await resolveWfs(baseUrl, effectiveLayerName));
    }
    else if (typ === "WMTS") {
        ({
            serviceUnavailable,
            serviceTitle,
            wmtsCapabilitiesUrl,
            wmtsFormat,
            wmtsTileMatrixSet,
            discoveredLayerEntries,
            effectiveLayerName
        } = await resolveWmts(baseUrl, effectiveLayerName));
    }
    else if (typ === "OAF") {
        ({
            serviceUnavailable,
            serviceTitle,
            baseUrl: effectiveBaseUrl,
            discoveredLayerEntries,
            effectiveLayerName
        } = await resolveOaf(url, baseUrl, effectiveLayerName));
    }

    return {
        typ,
        baseUrl: effectiveBaseUrl,
        effectiveLayerName,
        wfsVersion,
        wfsOutputFormat,
        wfsFeatureNS,
        wmtsCapabilitiesUrl,
        wmtsFormat,
        wmtsTileMatrixSet,
        serviceUnavailable,
        serviceTitle,
        discoveredLayerEntries
    };
}
