import axios from "axios";
import parseCswOnlineResource from "../../js/parseCswOnlineResource.js";
import resolveCswServiceConfig from "../../js/resolveCswServiceConfig.js";
import {addServiceLayersToExternalFolder} from "../../js/externalServiceFolder.js";
import {createWfsLoadingStrategyService} from "../../js/wfsLoadingStrategy.js";

/**
 * Helper functions for the addLayerFromCswRecord action.
 * Handles CSW record fetching, parsing, service resolution and layer insertion.
 * @module modules/searchBar/store/actions/addLayerFromCswRecordHelper
 */

/**
 * Fetches the CSW record XML for the given file identifier.
 * @param {String} cswUrl The CSW endpoint URL.
 * @param {String} fileIdentifier The CSW record UUID.
 * @returns {Promise<Document>} Parsed XML document.
 */
export async function fetchCswRecordXml (cswUrl, fileIdentifier) {
    const gmdNs = "http://www.isotc211.org/2005/gmd",
        response = await axios.get(cswUrl, {
            params: {
                service: "CSW",
                request: "GetRecordById",
                version: "2.0.2",
                outputschema: gmdNs,
                elementsetname: "full",
                id: fileIdentifier
            }
        });

    return response.request?.responseXML || new DOMParser().parseFromString(response.data, "application/xml");
}

/**
 * Builds the alert payload for the add-layer-from-CSW operation result.
 * @param {Object} param Result state.
 * @param {Boolean} param.layerAdded Whether at least one layer was added.
 * @param {Set<String>} param.unavailableServiceUrls URLs of unreachable services.
 * @returns {Object} Alert payload for Alerting/addSingleAlert.
 */
export function buildAlertPayload ({layerAdded, unavailableServiceUrls}) {
    const operationTimestamp = new Date(Date.now() - 1000).toISOString(),
        commonAlertProps = {
            once: true,
            initial: false,
            displayFrom: operationTimestamp
        };

    if (layerAdded) {
        return {
            category: "success",
            title: i18next.t("common:modules.searchBar.csw.layerAddedTitle"),
            content: i18next.t("common:modules.searchBar.csw.layerAdded"),
            multipleAlert: true,
            ...commonAlertProps
        };
    }

    if (unavailableServiceUrls.size > 0) {
        return {
            category: "info",
            content: i18next.t("common:modules.searchBar.csw.noServiceResponse", {serviceUrl: unavailableServiceUrls.values().next().value}),
            ...commonAlertProps
        };
    }

    return {
        category: "info",
        content: i18next.t("common:modules.searchBar.csw.noLayerLink"),
        ...commonAlertProps
    };
}

/**
 * Builds the service-type-specific additional layer properties.
 * @param {Object} param Resolved service config fields.
 * @param {String} param.typ Detected service type.
 * @param {String} param.baseUrl Service base URL.
 * @param {String} param.wfsVersion WFS version string.
 * @param {String} param.wfsOutputFormat WFS output format.
 * @param {String} param.wmtsCapabilitiesUrl Pre-resolved WMTS capabilities URL.
 * @param {String} param.wmtsFormat WMTS tile format.
 * @param {String} param.wmtsTileMatrixSet WMTS tile matrix set identifier.
 * @returns {Object} Additional layer configuration properties.
 */
export function buildAdditionalLayerProps ({typ, baseUrl, wfsVersion, wfsOutputFormat, wmtsCapabilitiesUrl, wmtsFormat, wmtsTileMatrixSet}) {
    if (typ === "WFS") {
        return {
            version: wfsVersion,
            outputFormat: wfsOutputFormat
        };
    }

    if (typ === "WMTS") {
        const wmtsProps = {
            optionsFromCapabilities: true,
            capabilitiesUrl: wmtsCapabilitiesUrl || `${baseUrl}?SERVICE=WMTS&REQUEST=GetCapabilities`
        };

        if (wmtsFormat) {
            wmtsProps.format = wmtsFormat;
        }
        if (wmtsTileMatrixSet) {
            wmtsProps.tileMatrixSet = wmtsTileMatrixSet;
        }

        return wmtsProps;
    }

    if (typ === "OAF") {
        return {
            bbox: false,
            crs: false,
            loadingStrategy: "all"
        };
    }

    return {};
}

/**
 * Dispatches an error alert when the CSW record fetch fails.
 * @param {Function} dispatch Vuex dispatch.
 * @returns {void}
 */
export function alertCswFetchError (dispatch) {
    console.warn("addLayerFromCswRecord: Failed to fetch CSW record.");
    dispatch("Alerting/addSingleAlert", {
        category: "error",
        content: i18next.t("common:modules.searchBar.csw.noLayerLink")
    }, {root: true});
}

/**
 * Builds a single-entry layer array for a known effective layer name.
 * @param {Object} param Resolved service config fields.
 * @param {String} param.typ Service type.
 * @param {String} param.effectiveLayerName Resolved layer name.
 * @param {String} param.wfsFeatureNS WFS feature namespace.
 * @param {String} param.wmtsFormat WMTS tile format.
 * @param {String} param.wmtsTileMatrixSet WMTS tile matrix set identifier.
 * @returns {Object[]} Single-entry layer array.
 */
function buildSingleLayerEntries ({typ, effectiveLayerName, wfsFeatureNS, wmtsFormat, wmtsTileMatrixSet}) {
    let singleLayerSourceProps;

    if (typ === "WFS") {
        singleLayerSourceProps = {featureType: effectiveLayerName};
    }
    else if (typ === "OAF") {
        singleLayerSourceProps = {collection: effectiveLayerName};
    }
    else {
        singleLayerSourceProps = {layers: effectiveLayerName};
    }

    if (typ === "WFS" && wfsFeatureNS) {
        singleLayerSourceProps.featureNS = wfsFeatureNS;
    }
    if (typ === "WMTS" && wmtsFormat) {
        singleLayerSourceProps.format = wmtsFormat;
    }
    if (typ === "WMTS" && wmtsTileMatrixSet) {
        singleLayerSourceProps.tileMatrixSet = wmtsTileMatrixSet;
    }

    return [{name: effectiveLayerName, sourceProps: singleLayerSourceProps}];
}

/**
 * Processes a single CSW online resource and adds any resolved layers to the external folder.
 * @param {Object} param Processing context.
 * @param {Object} param.parsedResource Parsed CSW online resource.
 * @param {Number} param.resourceIndex Index of the resource in the parent loop.
 * @param {Boolean} param.filterNonQueryableLayers Whether to filter out non-queryable entries.
 * @param {Object} param.rootGetters Vuex rootGetters.
 * @param {Function} param.dispatch Vuex dispatch.
 * @param {Document} param.responseXml Full CSW record XML.
 * @param {String} param.gmdNs GMD XML namespace.
 * @param {String} param.gcoNs GCO XML namespace.
 * @param {Object} param.cswContext CSW context for folder creation.
 * @returns {Promise<{layerAdded: Boolean, unavailableServiceUrl: String|null}>} Result.
 */
async function processOnlineResource ({
    parsedResource,
    resourceIndex,
    filterNonQueryableLayers,
    rootGetters,
    dispatch,
    responseXml,
    gmdNs,
    gcoNs,
    cswContext
}) {
    const {
            typ,
            baseUrl,
            effectiveLayerName,
            wfsVersion,
            wfsOutputFormat,
            wfsFeatureNS,
            wmtsCapabilitiesUrl,
            wmtsFormat,
            wmtsTileMatrixSet,
            serviceUnavailable,
            serviceTitle,
            discoveredLayerEntries: rawLayerEntries
        } = await resolveCswServiceConfig(parsedResource),
        discoveredLayerEntries = filterNonQueryableLayers && rawLayerEntries.length > 0
            ? rawLayerEntries.filter(entry => entry.queryable !== false)
            : rawLayerEntries;

    if (!typ) {
        return {layerAdded: false, unavailableServiceUrl: null};
    }

    const additionalLayerProps = buildAdditionalLayerProps({
        typ,
        baseUrl,
        wfsVersion,
        wfsOutputFormat,
        wmtsCapabilitiesUrl,
        wmtsFormat,
        wmtsTileMatrixSet
    });

    if (typ === "WFS") {
        const wfsLoadingStrategyService = createWfsLoadingStrategyService({
            baseUrl,
            wfsVersion,
            responseXml,
            gmdNs,
            gcoNs,
            mapCollection,
            dispatch
        });

        if (effectiveLayerName) {
            const featureCount = await wfsLoadingStrategyService.getWfsHits(effectiveLayerName);

            if (featureCount !== null && featureCount > wfsLoadingStrategyService.WFS_LARGE_LAYER_THRESHOLD) {
                additionalLayerProps.loadingStrategy = "bbox";
                wfsLoadingStrategyService.alertLargeLayer({featureCount, layerName: effectiveLayerName});
            }
            else {
                additionalLayerProps.loadingStrategy = "all";
            }
        }
        else if (discoveredLayerEntries.length > 0) {
            await wfsLoadingStrategyService.applyDiscoveredWfsLoadingStrategies(discoveredLayerEntries);
        }
    }

    const folderParams = {
        rootGetters,
        dispatch,
        serviceConfig: {
            serviceType: typ,
            serviceTitle,
            layerEntries: discoveredLayerEntries,
            baseUrl,
            resourceIndex,
            additionalLayerProps
        },
        cswContext
    };

    if (discoveredLayerEntries.length > 0 && await addServiceLayersToExternalFolder(folderParams)) {
        return {layerAdded: true, unavailableServiceUrl: serviceUnavailable ? baseUrl : null};
    }

    if (!effectiveLayerName) {
        return {layerAdded: false, unavailableServiceUrl: serviceUnavailable ? baseUrl : null};
    }

    const singleLayerAdded = await addServiceLayersToExternalFolder({
        ...folderParams,
        serviceConfig: {
            ...folderParams.serviceConfig,
            layerEntries: buildSingleLayerEntries({typ, effectiveLayerName, wfsFeatureNS, wmtsFormat, wmtsTileMatrixSet})
        }
    });

    return {layerAdded: singleLayerAdded, unavailableServiceUrl: serviceUnavailable ? baseUrl : null};
}

/**
 * Iterates over all CSW online resources and attempts to add layers for each.
 * @param {Object} param Iteration context.
 * @param {HTMLCollectionOf<Element>} param.onlineResources CSW CI_OnlineResource elements.
 * @param {Boolean} param.filterNonQueryableLayers Whether to filter non-queryable layers.
 * @param {Object} param.rootGetters Vuex rootGetters.
 * @param {Function} param.dispatch Vuex dispatch.
 * @param {Document} param.responseXml Full CSW record XML.
 * @param {String} param.gmdNs GMD XML namespace.
 * @param {String} param.gcoNs GCO XML namespace.
 * @param {Object} param.cswContext CSW context metadata.
 * @returns {Promise<{layerAdded: Boolean, unavailableServiceUrls: Set<String>}>} Aggregated result.
 */
export async function addLayersFromOnlineResources ({
    onlineResources,
    filterNonQueryableLayers,
    rootGetters,
    dispatch,
    responseXml,
    gmdNs,
    gcoNs,
    cswContext
}) {
    const unavailableServiceUrls = new Set();
    let layerAdded = false;

    for (let i = 0; i < onlineResources.length; i++) {
        const parsedResource = parseCswOnlineResource(onlineResources[i]);

        if (!parsedResource.url) {
            continue;
        }
        const {layerAdded: resourceLayerAdded, unavailableServiceUrl} = await processOnlineResource({
            parsedResource,
            resourceIndex: i,
            filterNonQueryableLayers,
            rootGetters,
            dispatch,
            responseXml,
            gmdNs,
            gcoNs,
            cswContext
        });

        if (unavailableServiceUrl) {
            unavailableServiceUrls.add(unavailableServiceUrl);
        }
        if (resourceLayerAdded) {
            layerAdded = true;
            break;
        }
    }

    return {layerAdded, unavailableServiceUrls};
}
