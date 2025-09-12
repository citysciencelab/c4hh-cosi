import axios from "axios";
import {buildEndpointUrl} from "../utils/buildEndpointUrl";
import {Draw, Modify, Translate} from "ol/interaction";
import {Style, Stroke, Fill, Circle as CircleStyle} from "ol/style";
import wfs from "@masterportal/masterportalapi/src/layer/wfs";
import createTransactionFeature from "../utils/createTransactionFeature";
import prepareFeatureProperties from "../utils/prepareFeatureProperties";
import mergeFormValuesWithProperties from "../utils/mergeFormValuesWithProperties";
import layerCollection from "@core/layers/js/layerCollection";

let drawInteraction,
    drawLayer,
    modifyInteraction,
    selectInteraction,
    featureProperties = [],
    translateInteraction;

const actions = {
    async loadCategories ({commit, getters}) {
        const url = buildEndpointUrl(getters.categoriesUrl, {t: Date.now()}),
            response = await axios.get(url);

        commit("setCategories", response.data.categories);
    },
    async loadDepartments ({commit, getters}) {
        const url = buildEndpointUrl(getters.departmentsUrl, {t: Date.now()}),
            response = await axios.get(url);

        commit("setDepartments", response.data.departments);
    },
    /**
     * Clears all map interactions and resets related variables.
     * @param {Object} dispatch - The dispatch object.
     * @returns {void}
     */
    clearInteractions ({dispatch}) {
        const map = mapCollection.getMap("2D");

        if (drawInteraction) {
            dispatch("Maps/removeInteraction", drawInteraction, {root: true});
        }
        if (modifyInteraction) {
            dispatch("Maps/removeInteraction", modifyInteraction, {root: true});
        }
        if (selectInteraction) {
            dispatch("Maps/removeInteraction", selectInteraction, {root: true});
        }
        if (translateInteraction) {
            dispatch("Maps/removeInteraction", translateInteraction, {root: true});
        }
        map.removeLayer(drawLayer);

        drawInteraction = undefined;
        modifyInteraction = undefined;
        selectInteraction?.getFeatures().clear();
        selectInteraction = undefined;
        translateInteraction = undefined;
        drawLayer = undefined;
    },
    /**
     * Prepares everything so that the user can interact with features or draw features
     * to be able to send a transaction to the service.
     *
     * @param {Function} dispatch - The dispatch function to trigger actions.
     * @param {Function} getters - The getters function to access state values.
     * @param {Function} rootGetters - The root getters function to access state values.
     * @param {Function} commit - The commit function to trigger mutations.
     * @param {("Point"|"update")} interaction Identifier of the selected interaction.
     * @returns {void}
     */
    async setMapInteraction ({dispatch, getters, rootGetters, commit}, interaction) {
        dispatch("clearInteractions");

        const {layerInformation} = getters;

        switch (interaction) {
            case "Point":
                commit("setSelectedInteraction", "insert");
                dispatch("handleDrawInteraction", {
                    interaction,
                    layerInformation,
                    rootGetters
                });
                break;
            // case "update":
            //     commit("setSelectedInteraction", "singleUpdate");
            //     dispatch("handleUpdateInteraction", {
            //         sourceLayer
            //     });
            //     break;
            default:
                break;
        }
    },
    /**
     * Handles draw interaction for a single feature.
     * @param {Function} commit - The commit function to trigger mutations.
     * @param {Function} dispatch - The dispatch function to trigger actions.
     * @param {Object} payload - The payload object.
     * @returns {void}
     */
    async handleDrawInteraction ({commit, dispatch}, payload) {
        const {interaction, layerInformation} = payload,
            pointStyle = new Style({
                image: new CircleStyle({
                    radius: 10,
                    fill: new Fill({
                        color: "rgba(9, 237, 245, 1)"
                    }),
                    stroke: new Stroke({
                        color: "rgba(255, 255, 255, 1)",
                        width: 2
                    })
                })
            }),
            layer = layerInformation[0];

        featureProperties = await wfs.receivePossibleProperties(layer.url, layer.version, layer.featureType, layer.isSecured);
        let drawOptions = {};

        drawLayer = await dispatch("Maps/addNewLayerIfNotExists", {layerName: "module/geoMarker/vectorLayer", id: "module/geoMarker/vectorLayer"}, {root: true});

        drawOptions = {
            source: drawLayer.getSource(),
            type: interaction,
            stopClick: true,
            geometryName: featureProperties.find(({type}) => type === "geometry")?.key,
            style: pointStyle
        };

        drawInteraction = new Draw(drawOptions);

        modifyInteraction = new Modify({
            source: drawLayer.getSource()
        });

        translateInteraction = new Translate({
            layers: [drawLayer]
        });

        drawLayer.setStyle(pointStyle);

        drawInteraction.on("drawend", (event) => {
            commit("setSelectedInteraction", "insert");
            commit("setNewGeoMarkerFeature", event.feature);

            drawLayer.getSource().clear();

            dispatch("Maps/removeInteraction", drawInteraction, {root: true});

            dispatch("Maps/addInteraction", modifyInteraction, {root: true});
            dispatch("Maps/addInteraction", translateInteraction, {root: true});
        });

        dispatch("Maps/addInteraction", drawInteraction, {root: true});
    },
    /**
     * Simplified save function for Point geometry only
     * @param {Function} context.dispatch - The dispatch function
     * @param {Function} context.getters - The getters function
     * @param {Function} context.commit - The commit function
     * @param {Object} payload.newGeoMarkerFormValues - Form values for the new GeoMarker.
     * @param {Array<String>} payload.updatedLayerIds - Array of layer IDs to refresh after saving.
     * @returns {Promise<{transactionFeature: Object, transactionResponse: Object}>} - feature that we save and response of the request. (Both is actually almost the same and will be changed later.)
    */
    async savePoint ({dispatch, commit, getters}, {newGeoMarkerFormValues, updatedLayerIds}) {
        const {newGeoMarkerFeature, layerInformation} = getters,
            layer = layerInformation[0],
            preparedFeatureProperties = await prepareFeatureProperties(layer),
            featurePropertiesWithFormValues = await mergeFormValuesWithProperties(preparedFeatureProperties, newGeoMarkerFormValues),
            geometryProperty = featurePropertiesWithFormValues.find(({type}) => type === "geometry");

        let transactionResponse,
            transactionFeature = null;

        try {
            transactionFeature = await createTransactionFeature(
                {
                    geometry: newGeoMarkerFeature.get("geom"),
                    geometryName: geometryProperty.key
                },
                featurePropertiesWithFormValues,
                false,
                layer.featurePrefix
            );

            transactionResponse = await dispatch("sendTransaction", {feature: transactionFeature, selectedInteraction: "insert"});
        }
        catch (error) {
            console.error("Point save error:", error);
            dispatch("Alerting/addSingleAlert", {
                category: "error",
                content: i18next.t("common:modules.wfst.error.saveFailed") + ": " + error.message,
                mustBeConfirmed: false
            }, {root: true});
        }
        finally {
            updatedLayerIds.forEach(layerId => {
                dispatch("refreshLayer", layerId);
                commit("setNewGeoMarkerFeature", null);
            });
        }

        return {transactionFeature, transactionResponse};
    },

    /**
     * Handles WFS transaction communication with the server for point features.
     * Prepares the transaction request by cleaning layer configuration, sends the
     * feature data to the WFS endpoint, processes the server response, and updates
     * the map layer accordingly. Shows appropriate success or error notifications
     * based on the transaction outcome.
     * @param {Object} context - Vuex context
     * @param {Function} context.dispatch - The dispatch function
     * @param {Function} context.rootGetters - The root getters function
     * @param {Object} payload.feature - Feature to save
     * @param {String} payload.selectedInteraction - Type of transaction (e.g. insert, update)
     * @returns {Promise<Object|null>} - The server response, or null if an error occurred.
     */
    async sendTransaction ({dispatch, rootGetters, getters}, {feature, selectedInteraction}) {
        const {layerInformation} = getters,
            layer = layerInformation[0];

        let response = null;

        try {
            response = await wfs.sendTransaction(
                rootGetters["Maps/projectionCode"],
                feature,
                layer.url,
                layer,
                selectedInteraction
            );

            if (response !== null) {
                dispatch("Alerting/addSingleAlert", {
                    category: "success",
                    content: i18next.t("common:modules.wfst.transaction.success.baseSuccess", {
                        transaction: i18next.t("common:modules.wfst.transaction.success." + selectedInteraction)
                    })
                }, {root: true});
            }
        }
        catch (e) {
            await dispatch("Alerting/addSingleAlert", {
                category: "error",
                displayClass: "error",
                content: `Error: ${e.message}`,
                mustBeConfirmed: false
            }, {root: true});
            response = null;
        }
        return response;
    },

    /**
     * Refreshes the source of the map layer with the given layerId.
     * This triggers a reload of the layer's data from its source.
     *
     * @param {Object} _ - Vuex action context (unused).
     * @param {String} layerId - The ID of the layer to refresh.
     * @returns {void}
     */
    refreshLayer (_, layerId) {
        layerCollection.getLayerById(layerId)?.getLayerSource()?.refresh();
    }
};

export default actions;
