import {WFS} from "ol/format.js";
import {default as turfIntersect} from "@turf/intersect";
import {polygon as turfPolygon, featureCollection as turfFeatureCollection} from "@turf/helpers";
import axios from "axios";

export default {
    /**
     * Shows or hides the raster layer
     * @param {Object} param.dispatch the dispatch
     * @param {Object} param.getters the getters
     * @returns {void}
    */
    toggleRasterLayer ({dispatch, getters}) {
        const layerId = getters.wmsRasterLayerId;

        dispatch("replaceByIdInLayerConfig", {
            layerConfigs: [{
                id: layerId,
                layer: {
                    id: layerId,
                    showInLayerTree: getters.active,
                    visibility: getters.active
                }
            }]
        }, {root: true});
    },

    /**
    * Loads the WFS raster with the params stored in property wfsRasterParams.
    * On success the features are read.
    * @param {Object} getters vuex element
    * @param {Object} dispatch vuex element
    * @returns {void}
    */
    loadWfsRaster ({getters, dispatch}) {
        const params = getters.wfsRasterParams,
            urlParams = {
                "Service": params.service,
                "Version": params.version,
                "Request": params.request,
                "TypeName": params.typename
            };
        let alertingFailedToDownload = {};

        axios.get(params.url, {
            params: urlParams,
            headers: {
                "Content-Type": "text/xml"
            },
            responseType: "document"
        })
            .then(resp => {
                dispatch("readFeatures", resp.data);
            })
            .catch(error => {
                alertingFailedToDownload = {
                    "category": "error",
                    "content": i18next.t(getters.downloadError)
                };
                dispatch("Alerting/addSingleAlert", alertingFailedToDownload, {root: true});
                console.error(error.response);
            });
    },

    /**
     * Reads all features in the given data and stores it in the property wfsRaster
     * @param {Object} commit vuex element
     * @param {Object} data of the wfs response (XML)
     * @returns {void}
    */
    readFeatures ({commit}, data) {
        const format = new WFS(),
            features = format.readFeatures(data);

        commit("setWfsRaster", features);
    },

    /**
     * Calculates the intersection of the graphical selection with the raster. The names of the intersected raster squares are then commited to the state.
     * @see {@link https://turfjs.org/docs/#intersect}
     * @param {Object} getters vuex element
     * @param {Object} dispatch vuex element
     * @param {Object} rootState vuex element
     * @returns {void}
    */
    async calculateSelectedRasterNames ({getters, dispatch, commit, rootState}) {
        const rasterLayerFeatures = getters.wfsRaster,
            selectedAreaGeoJson = rootState.Modules.GraphicalSelect.selectedAreaGeoJson,
            rasterNames = [];

        if (selectedAreaGeoJson && selectedAreaGeoJson.coordinates) {
            const turfGeoSelection = turfPolygon([selectedAreaGeoJson.coordinates[0]]);

            rasterLayerFeatures.forEach(async feature => {
                const featureGeojson = await dispatch("Modules/GraphicalSelect/featureToGeoJson", feature, {root: true}),
                    turfRaster = turfPolygon([featureGeojson.coordinates[0]]);

                if (turfIntersect(turfFeatureCollection([turfGeoSelection, turfRaster]))) {
                    await dispatch("addFeaturenameToRasternames", {feature: feature, rasterNames: rasterNames});
                }
            });
        }
        commit("setRasterNames", rasterNames);

    },

    /**
     * Adds the name of the features tile to the given list of rasterNames.
     * @param {Object} context vuex element
     * @param {Object} payload vuex element
     * @param {Object} payload.feature to get the name of the tile
     * @param {Object} payload.rasterNames array to fill with unique names
     * @returns {void}
    */
    addFeaturenameToRasternames (context, payload) {
        if (payload.feature && payload.rasterNames) {
            const intersectedRasterName = payload.feature.getProperties().kachel,
                result = payload.rasterNames.find(rasterName => rasterName === intersectedRasterName);

            if (result === undefined) {
                payload.rasterNames.push(intersectedRasterName);
            }
        }
    },

    /**
     * Collects the params to request the WMS for "Kacheln" and triggers the request.
     * @param {Object} getters vuex element
     * @param {Object} dispatch vuex element
     * @returns {void}
    */
    async requestCompressedData ({getters, dispatch}) {
        const params = {};

        dispatch("calculateSelectedRasterNames").then(() =>dispatch("checkRasterNamesAmount").then(response => {
            if (response === true) {
                const adaptedNames = [],
                    selectedRasterNames = getters.rasterNames;

                selectedRasterNames.forEach(rasterName => {
                    const adaptedName = rasterName.substring(0, 2) + "0" + rasterName.substring(2, 4) + "0";

                    adaptedNames.push(adaptedName);
                });

                // params.query has to look like: "kacheln=650330§650340&type=JPG"
                params.query = "kacheln=" + adaptedNames.join("§") + "&type=" + getters.selectedFormat;
                params.downloadName = "zip_" + getters.selectedFormat + "_" + adaptedNames.sort()[0] + ".zip";

                dispatch("doRequest", params);
            }
        }));
    },

    /**
     * Checks the models "rasterNames":
     * If there are more than the number of state.selectedRasterLimit tiles selected, the user is warned to reduce the selection.
     * If there are no tiles selected, the user is informed to select some.
     * @param {Object} getters vuex element
     * @param {Object} dispatch vuex element
     * @returns {Booelan} true if check is okay to request server
     */
    checkRasterNamesAmount ({getters, dispatch}) {
        const selectedRasterNames = getters.rasterNames;

        let alertingTilesAmount = {},
            alertingNoTiles = {};

        if (selectedRasterNames.length > getters.selectedRasterLimit) {
            alertingTilesAmount = {
                "category": "info",
                "content": i18next.t(getters.tooManyTilesSelected, {tilesCount: selectedRasterNames.length, maxTiles: getters.selectedRasterLimit})
            };
            dispatch("Alerting/addSingleAlert", alertingTilesAmount, {root: true});

            return false;
        }
        else if (selectedRasterNames.length === 0) {
            alertingNoTiles = {
                "category": "error",
                "content": "<strong>" + i18next.t(getters.pleaseSelectTiles) + "</strong>"
            };
            dispatch("Alerting/addSingleAlert", alertingNoTiles, {root: true});
            return false;
        }
        return true;
    },

    /**
     * Collects the params to request the WMS for island data.Params have to look like: "insel=Neuwerk&type=JPG"
     * @param {Object} getters vuex element
     * @param {String} islandName name of the island
     * @param {Object} dispatch vuex element
     * @returns {void}
     */
    requestCompressIslandData ({getters, dispatch}, islandName) {
        const params = {
            "downloadName": "zip_" + getters.selectedFormat + "_" + islandName + ".zip",
            "query": "insel=" + islandName + "&type=" + getters.selectedFormat
        };

        dispatch("doRequest", params);
    },

    /**
     * Collects the params to load an overview.
     * @param {Object} dispatch vuex element
     * @param {String} format the LS state
     * @returns {void}
     */
    requestCompressRasterOverviewData ({dispatch}, format) {
        const params = {
            "downloadName": "U__Kachel_Uebersichten_UTM_Kachel_1KM_" + format + ".dwg",
            "query": "system=utm&type=" + format
        };

        dispatch("doRequest", params);
    },

    /**
     * Requests the rest-service and loads the data e.g. dwg, xml,jpg as zip-file down.
     * @param {Object} getters vuex element
     * @param {String} params to specify the request
     * @param {Object} dispatch vuex element
     * @param {Object} commit vuex element
     * @returns {void}
     */
    doRequest ({getters, dispatch, commit, rootGetters}, params) {
        const url = rootGetters.restServiceById(getters.compressDataId).url,
            dataZip = axios.create();

        let alertingFailedToDownload = {},
            alertingServiceNotresponding = {};

        commit("setTransactionProcessing", true);
        // function before the request is sent
        dataZip.interceptors.request.use(function (request) {
            return request;
        });

        // function before the response is handled
        dataZip.interceptors.response.use(function (response) {
            commit("setTransactionProcessing", false);
            return response;
        });

        dataZip.post(url, params.query, {
            timeout: 15000,
            responseType: "blob"
        })
            .then(resp => {
                commit("setGraphicalSelectStatus", true);
                if (resp.status !== 200) {
                    alertingFailedToDownload = {
                        "category": "error",
                        "content": "<strong>" + i18next.t(getters.failedToDownload) + "</strong> <br> <small>" + i18next.t(getters.details) + " " + resp.data + "</small>"
                    };
                    dispatch("Alerting/addSingleAlert", alertingFailedToDownload, {root: true});
                }
                else {
                    const blob = new Blob([resp.data]),
                        downloadUrl = window.URL.createObjectURL(blob),
                        link = document.createElement("a");

                    // IE11
                    if (window.navigator.msSaveOrOpenBlob) {
                        window.navigator.msSaveOrOpenBlob(blob, params.downloadName);
                    }
                    else { // Chrome, FF
                        link.href = downloadUrl;
                        link.setAttribute("download", params.downloadName);
                        document.body.appendChild(link);
                        link.click();
                        link.remove();
                    }

                }
            })
            .catch(() => {
                alertingServiceNotresponding = {
                    "category": "error",
                    "content": "<strong>" + i18next.t(getters.failedToDownload) + "</strong> <br> <small>" + i18next.t(getters.details) + " " + i18next.t(getters.serviceNotResponding) + "</small>"
                };
                commit("setGraphicalSelectStatus", false);
                dispatch("Alerting/addSingleAlert", alertingServiceNotresponding, {root: true});
            });
    }
};
