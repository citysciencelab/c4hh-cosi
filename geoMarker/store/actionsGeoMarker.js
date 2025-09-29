import axios from "axios";
import {buildEndpointUrl} from "../utils/buildEndpointUrl";
import {Draw, Modify, Select, Translate} from "ol/interaction";
import {Style, Stroke, Fill, Circle as CircleStyle} from "ol/style";
import wfs from "@masterportal/masterportalapi/src/layer/wfs";
import createTransactionFeature from "../utils/createTransactionFeature";
import prepareFeatureProperties from "../utils/prepareFeatureProperties";
import mergeFormValuesWithProperties from "../utils/mergeFormValuesWithProperties";
import layerCollection from "@core/layers/js/layerCollection";
import wfsSendTransaction from "../utils/wfsSendTransaction";

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
    clearInteractions ({commit, dispatch, getters}) {
        const {drawInteraction, modifyInteraction, translateInteraction, drawLayer, selectInteraction} = getters,
            map = mapCollection.getMap("2D");

        if (drawLayer) {
            // Remove all features from the drawLayer's source
            const source = drawLayer.getSource && drawLayer.getSource();

            if (source && typeof source.clear === "function") {
                source.clear();
            }

            map.removeLayer(drawLayer);
        }

        if (drawInteraction) {
            dispatch("Maps/removeInteraction", drawInteraction, {root: true});
        }
        if (modifyInteraction) {
            dispatch("Maps/removeInteraction", modifyInteraction, {root: true});
        }
        if (selectInteraction) {
            const features = selectInteraction.getFeatures();

            features.forEach(f => features.remove(f));
            features.clear();

            dispatch("Maps/removeInteraction", selectInteraction, {root: true});
        }
        if (translateInteraction) {
            dispatch("Maps/removeInteraction", translateInteraction, {root: true});
        }

        commit("setDrawInteraction", undefined);
        commit("setModifyInteraction", undefined);
        commit("setSelectedInteraction", undefined);
        commit("setTranslateInteraction", undefined);
        commit("setDrawLayer", undefined);
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
            case "update":
                commit("setSelectedInteraction", "singleUpdate");
                dispatch("handleUpdateInteraction");
                break;
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
            layer = layerInformation[0],
            featureProperties = await wfs.receivePossibleProperties(layer.url, layer.version, layer.featureType, layer.isSecured),
            drawLayer = await dispatch("Maps/addNewLayerIfNotExists", {layerName: "module/geoMarker/vectorLayer", id: "module/geoMarker/vectorLayer"}, {root: true}),
            drawOptions = {
                source: drawLayer.getSource(),
                type: interaction,
                stopClick: true,
                geometryName: featureProperties.find(({type}) => type === "geometry")?.key,
                style: pointStyle
            },
            drawInteraction = new Draw(drawOptions),
            modifyInteraction = new Modify({
                source: drawLayer.getSource()
            }),
            translateInteraction = new Translate({
                layers: [drawLayer]
            });

        commit("setDrawInteraction", drawInteraction);
        commit("setModifyInteraction", modifyInteraction);
        commit("setTranslateInteraction", translateInteraction);
        commit("setDrawLayer", drawLayer);

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
     * Handles update interaction for a single feature.
     * @param {Function} commit - The commit function to trigger mutations.
     * @param {Function} dispatch - The dispatch function to trigger actions.
     * @param {Function} getters - The getters function to access state values.
     * @param {Object} payload - The payload object.
     * @returns {void}
     */
    handleUpdateInteraction ({commit, dispatch, getters}) {
        const {geoMarkerUpdateLayerIds} = getters,
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
            sourceLayer = geoMarkerUpdateLayerIds.map(id => {
                return mapCollection.getMap("2D") ? mapCollection.getMap("2D").getLayers().getArray().find(layer => {
                    return layer.get("id") === id;
                }) : undefined;
            }),
            selectInteraction = new Select({
                layers: sourceLayer,
                multi: true,
                hitTolerance: 5,
                style: pointStyle,
                filter: (feature) => feature.getId() === getters.geoMarkerFeatureSelected?.getId()
            }),
            selectedFeatures = selectInteraction.getFeatures(),
            rollbackFeature = getters.geoMarkerFeatureSelected.clone();

        sourceLayer.forEach(layer => {
            if (layer) {
                const source = layer.getSource(),
                    feature = source.getFeatureById(getters.geoMarkerFeatureSelected?.getId());

                if (feature) {

                    selectedFeatures.push(feature);
                }
            }
        });

        rollbackFeature.setId(getters.geoMarkerFeatureSelected.getId());
        commit("setRollbackGeoMarkerFeature", rollbackFeature);
        selectedFeatures.set("selected", true);
        commit("setSelectInteraction", selectInteraction);
        commit("setSelectedInteraction", "selectedUpdate");
        dispatch("Maps/addInteraction", selectInteraction, {root: true});
        dispatch("addModifyAndTranslateInteractions", {target: selectedFeatures});
    },
    /**
     * Adds modify and translate interactions to the selected features.
     * modify - allows moving the feature with the mouse without any special key
     * translate - adds the different icon for the mouse when moving the feature
     * @param {Function} commit - The commit function to trigger mutations.
     * @param {Function} dispatch - The dispatch function to trigger actions.
     * @param {Object} payload - The payload object.
     * @returns {void}
     */
    addModifyAndTranslateInteractions ({commit, dispatch}, payload) {
        const {target} = payload,
            modifyInteraction = new Modify({
                features: target
            }),
            translateInteraction = new Translate({
                features: target
            });

        commit("setModifyInteraction", modifyInteraction);
        commit("setTranslateInteraction", translateInteraction);

        modifyInteraction.on("modifyend", (event) => {
            commit("setGeoMarkerUpdateFeature", event.features.getArray()[0]);
        });

        translateInteraction.on("translatestart", () => {
            dispatch("Maps/removePointMarker", null, {root: true});
        });

        translateInteraction.on("translateend", (event) => {
            commit("setGeoMarkerUpdateFeature", event.features.getArray()[0]);
        });

        dispatch("Maps/addInteraction", modifyInteraction, {root: true});
        dispatch("Maps/addInteraction", translateInteraction, {root: true});
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
            response = await wfsSendTransaction(
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
    },

    /**
     * Rolls back the geometry of the selected GeoMarker feature to its previous state.
     * This action restores the geometry of the feature in both the feature list and all relevant layers,
     * then refreshes the sources of those layers to update the map display.
     * After rollback, the rollback feature state is cleared.
     *
     * @param {Object} context - Vuex action context.
     * @param {Function} context.commit - The commit function to trigger mutations.
     * @param {Function} context.getters - The getters function to access state values.
     * @returns {void}
     */
    rollbackGeoMarkerUpdateFeature ({commit, getters}) {
        if (getters.rollbackGeoMarkerFeature && getters.geoMarkerUpdateLayerIds) {
            const layers = mapCollection.getMap("2D").getLayers().getArray().filter(layer => getters.geoMarkerUpdateLayerIds.includes(layer.get("id")));

            getters.geoMarkerFeatureList.map(feature => {
                if (feature.getId() === getters.rollbackGeoMarkerFeature.getId()) {
                    feature.setGeometry(getters.rollbackGeoMarkerFeature.getGeometry().clone());
                }

                return feature;
            });

            layers.forEach(layer => {
                const source = layer.getSource(),
                    feature = source.getFeatureById(getters.rollbackGeoMarkerFeature.getId());

                if (feature?.getGeometry()) {
                    feature.setGeometry(getters.rollbackGeoMarkerFeature.getGeometry().clone());
                }
                source.refresh();
            });
        }

        commit("setRollbackGeoMarkerFeature", null);
    }
};

export default actions;
