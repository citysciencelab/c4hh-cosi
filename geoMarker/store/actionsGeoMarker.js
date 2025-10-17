import axios from "axios";
import {buildEndpointUrl} from "../utils/buildEndpointUrl";
import {Draw, Modify, Select, Translate} from "ol/interaction";
import {Style, Stroke, Fill, Circle as CircleStyle} from "ol/style";
import {resourceId} from "ol/format/filter";
import WFS from "ol/format/WFS";
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
     * Saves a new geoMarker or updates an existing geoMarker
     * @param {Function} context.dispatch - The dispatch function
     * @param {Function} context.getters - The getters function
     * @param {Function} context.commit - The commit function
     * @param {Object} payload.geoMarkerFormValues - Form values of the GeoMarker to update or save.
     * @param {Array<String>} payload.updatedLayerIds - Array of layer IDs to refresh after saving.
     * @param {String} payload.selectedTransaction - Insert or update, to decide if geomarker is saved or updated.
     * @returns {Promise<{transactionFeature: Object, transactionResponse: Object}>} - feature that we save and response of the request. (Both is actually almost the same and will be changed later.)
    */
    async upsertPoint ({dispatch, commit, getters}, {geoMarkerFormValues, updatedLayerIds, selectedTransaction}) {
        const {newGeoMarkerFeature, layerInformation, geoMarkerFeatureSelected, geoMarkerUpdateFeature, geoMarkerFeatureList} = getters,
            layer = layerInformation[0],
            preparedFeatureProperties = await prepareFeatureProperties(layer),
            featurePropertiesWithFormValues = await mergeFormValuesWithProperties(preparedFeatureProperties, geoMarkerFormValues),
            geometryProperty = featurePropertiesWithFormValues.find(({type}) => type === "geometry"),
            isUpdate = selectedTransaction === "selectedUpdate";

        let transactionResponse,
            transactionFeature = null;

        try {
            transactionFeature = await createTransactionFeature(
                {
                    ...isUpdate ? {id: geoMarkerFeatureSelected.getId()} : {},
                    geometry: isUpdate
                        ? geoMarkerUpdateFeature.get("geom")
                        : newGeoMarkerFeature.get("geom"),
                    geometryName: geometryProperty.key
                },
                featurePropertiesWithFormValues,
                geoMarkerUpdateFeature,
                isUpdate,
                layer.featurePrefix
            );

            transactionResponse = await dispatch("sendTransaction", {feature: transactionFeature, selectedInteraction: selectedTransaction});
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
            updatedLayerIds.forEach(async layerId => {
                await dispatch("refreshLayerAndReapplyFilter", {layerId, geoMarkerFeatureList});
            });

            commit("setNewGeoMarkerFeature", null);
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
     * Refreshes the layer and reapplies the filter to maintain filtered features visibility.
     * This method ensures that after layer refresh, only the features that were visible
     * before the refresh remain visible on the map.
     *
     * @param {Object} context - Vuex action context.
     * @param {Object} payload - The payload object.
     * @param {String} payload.layerId - The ID of the layer to refresh.
     * @param {Array} payload.geoMarkerFeatureList - List of filtered features that should remain visible.
     * @returns {Promise<void>}
     */
    async refreshLayerAndReapplyFilter ({dispatch}, {layerId, geoMarkerFeatureList}) {
        const layer = layerCollection.getLayerById(layerId),
            layerSource = layer?.getLayerSource();

        if (!layer || !layerSource) {
            return;
        }

        await new Promise((resolve) => {
            /**
             * Handles the featuresloadend event to reapply the filter after layer refresh.
             * @returns {void}
             */
            function onFeaturesLoadEnd () {
                const style = layer.getStyleAsFunction(layer.get("style")),
                    allFeaturesOnLayer = layerSource.getFeatures(),
                    geoMarkerFeatureListIds = geoMarkerFeatureList.map(feature => feature.getId());

                allFeaturesOnLayer.forEach(feature => {
                    if (geoMarkerFeatureListIds.includes(feature.getId())) {
                        feature.setStyle(style(feature));
                    }
                    else {
                        feature.setStyle(new Style());
                    }
                });

                dispatch("setGeoMarkerFeatureList");
                layerSource.un("featuresloadend", onFeaturesLoadEnd);
                resolve();
            }

            layerSource.once("featuresloadend", onFeaturesLoadEnd);
            layerSource.refresh();
        });
    },
    /**
     * Updates the geometry of the geoMarker feature in the feature list after a modification.
     * Finds the updated feature in the corresponding layer and clones its geometry to the feature list.
     * Commits the updated feature list to the store.
     *
     * @param {Object} context - Vuex action context.
     * @param {Object} context.getters - The getters function to access state values.
     * @param {Function} context.commit - The commit function to trigger mutations.
     * @returns {void}
     */
    setGeoMarkerFeatureList ({getters, commit}) {
        const {geoMarkerUpdateLayerIds, geoMarkerUpdateFeature, geoMarkerFeatureList} = getters,
            updatedLayer = mapCollection.getMap("2D").getLayers().getArray().find(layer => geoMarkerUpdateLayerIds.includes(layer.get("id"))),
            updatedFeature = updatedLayer.getSource().getFeatureById(geoMarkerUpdateFeature.getId());

        if (updatedFeature) {
            geoMarkerFeatureList.map(feature => {
                if (feature.getId() === geoMarkerUpdateFeature.getId()) {
                    feature.setGeometry(updatedFeature?.getGeometry().clone());
                }

                return feature;
            });

            commit("setGeoMarkerFeatureList", geoMarkerFeatureList);
        }
    },
    /**
     * Laods a property of a feature using its featureId.
     * @param {*} context Vuex action context.
     * @param {*} context.dispatch The dispatch function
     * @param {*} payload.geomarkerId Geomarker id
     * @param {*} payload.propertyName Name of the property that will be loaded
     * @returns {*} - property
     */
    async loadPropertyOfFeatureById ({dispatch, getters}, payload) {
        const featureRequest = new WFS({version: "2.0.0"}).writeGetFeature({
                srsName: mapCollection.getMapView("2D").getProjection().getCode(),
                featureTypes: ["geomarker"],
                filter: resourceId(payload.geomarkerId)
            }),
            {geomarkerEditLayerUrl} = getters;

        let property = "";

        try {
            const response = await fetch(geomarkerEditLayerUrl,
                    {
                        headers: {
                            "Content-Type": "text/xml"
                        },
                        method: "POST",
                        body: new XMLSerializer().serializeToString(featureRequest)
                    }
                ),
                xmlString = await response.text(),
                xmlDoc = new DOMParser().parseFromString(xmlString, "text/xml");

            property = xmlDoc.getElementsByTagName(`de.hh.up:${payload.propertyName}`)[0]?.textContent;

            if (payload.propertyName && payload.propertyName.toLowerCase().includes("base_64")) {
                property = await dispatch("addBase64FilePrefix", property);
            }
        }
        catch (error) {
            console.error("Error loading features:", error);
        }

        return property;
    },
    /**
     * Converts a base64 string and adds the appropriate MIME type prefix
     * @param {*} _ Vuex action context (unused).
     * @param {String} base64String The base64 string to convert
     * @returns {String} - base64 string with MIME type prefix
     */
    async addBase64FilePrefix (_, base64String) {
        if (!base64String || typeof base64String !== "string" || base64String.trim() === "") {
            return base64String;
        }

        if (base64String.startsWith("data:")) {
            return base64String;
        }

        const signatures = {
            JVBERi0: "application/pdf",
            iVBORw0KGgo: "image/png",
            "/9j/": "image/jpeg",
            UEsDB: "application/zip"
        };

        let mimeType = null;

        for (const signature in signatures) {
            if (base64String.indexOf(signature) === 0) {
                mimeType = signatures[signature];
                break;
            }
        }

        if (!mimeType) {
            console.warn("Unable to detect MIME type for base64 string");
            return base64String;
        }

        return `data:${mimeType};base64,${base64String}`;
    },
    /**
     * Retrieves the URL of the GeoMarker edit layer from the layer configuration and commits it to the store.
     * Searches for the layer with the specified GeoMarker edit layer ID within the subjectlayer elements.
     * If found, commits the URL using the "setGeomarkerEditLayerUrl" mutation.
     *
     * @param {Object} context - Vuex action context.
     * @param {Object} context.rootGetters - Root getters to access global state.
     * @param {Function} context.commit - Commit function to trigger mutations.
     * @param {Object} context.getters - Getters to access local state.
     * @returns {void}
     */
    async getGeoMarkerEditLayerUrl ({rootGetters, commit, getters}) {
        const {layerConfig} = rootGetters,
            {geoMarkerEditLayerId} = getters,
            elements = layerConfig.subjectlayer?.elements;
        let url = "";

        if (elements && Array.isArray(elements)) {
            const geomarkerLayer = elements.find(element => element.id === geoMarkerEditLayerId);

            if (geomarkerLayer) {
                url = geomarkerLayer.url;
            }
        }

        commit("setGeomarkerEditLayerUrl", url);
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
            });
        }

        commit("setRollbackGeoMarkerFeature", null);
    }
};

export default actions;
