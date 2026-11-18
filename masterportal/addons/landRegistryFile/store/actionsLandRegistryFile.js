import getOAFFeature from "@shared/js/api/oaf/getOAFFeature.js";
import createStyle from "@masterportal/masterportalapi/src/vectorStyle/createStyle.js";
import GeoJSON from "ol/format/GeoJSON.js";
import layerCollection from "@core/layers/js/layerCollection.js";
import layerFactory from "@core/layers/js/layerFactory";
import Style from "ol/style/Style";
import Circle from "ol/style/Circle";
import Fill from "ol/style/Fill";
import buildOafFilterString from "../utils/buildOafFilterString";

export default {
    /**
         * Queries the OAF feature service with the provided parameters.
         * @param {Object} context - The Vuex context object.
         * @param {Function} context.commit Vuex commit function.
         * @param {Object} context.state Vuex module state.
         * @param {Function} context.dispatch Vuex dispatch function.
         * @param {Object} payload - The payload containing the query parameters.
         * @param {Object} payload.params - The values for filtering the OAF query.
         * @param {string|null} [payload.params.startDate] - The start date for filtering in YYYY-MM-DD format.
         * @param {string|null} [payload.params.endDate] - The end date for filtering in YYYY-MM-DD format.
         * @param {string|null} [payload.params.textValue] - The text value for text search filtering.
         * @param {Object|null} [payload.params.selectedFilters] - The selected options for select filtering.
         * @param {Array} [payload.params.bbox] - The bounding box for spatial filtering.
         * @param {string} [payload.params.crs] - The coordinate reference system.
         * @returns {Promise<boolean>} A promise that resolves to true if the query was successful, or false if an error occurred.
         */
    async queryOaf ({commit, state, dispatch}, {params}) {
        const oafParams = state.oafParams,
            filterString = buildOafFilterString(oafParams.filters, params);

        const queryParams = {
            limit: 10000,
            filter: filterString !== "" ? filterString : undefined,
            bbox: params.bbox,
            bboxCrs: params.crs,
            filterCrs: params.crs,
            crs: params.crs
        };

        try {
            const landRegistryFileFeatures = await getOAFFeature.getOAFFeatureGet(
                oafParams.url,
                oafParams.collection,
                queryParams
            );

            commit("setLandRegistryFileFeatures", landRegistryFileFeatures);

            dispatch("addFeaturesToMap", landRegistryFileFeatures);

            return true;
        }
        catch (error) {
            dispatch("Alerting/addSingleAlert", {
                category: "error",
                content: "Fehler beim Abrufen der Grundstücksakten. Bitte versuchen Sie es erneut."
            }, {root: true});

            console.error(error);

            return false;
        }
    },
    /**
         * Loads the OAF collection schema and stores it in the module state.
         * @param {Object} context Vuex action context.
         * @param {Function} context.commit Vuex commit function.
         * @param {Object} context.state Vuex module state.
         * @param {Function} context.dispatch Vuex dispatch function.
         * @returns {void}
    */
    queryOafSchema ({commit, state, dispatch}) {
        const oafParams = state.oafParams;

        commit("setShowLoadingSpinner", true);

        getOAFFeature.getCollectionSchema(oafParams.url, oafParams.collection)
            .then(schema => {
                commit("setOafSchema", schema);
            })
            .catch(error => {
                console.error(error);
                dispatch("Alerting/addSingleAlert", {
                    category: "error",
                    content: `Fehler beim Abrufen notwendiger Daten für ${oafParams.collection}. Bitte versuchen Sie es erneut.`
                }, {root: true});
            }).finally(() => {
                commit("setShowLoadingSpinner", false);
            });
    },
    /**
     * Adds the provided GeoJSON features to the map using the configured style.
     * @param {Object} context - The Vuex action context.
     * @param {Object} context.state - Vuex state object.
     * @param {Function} context.commit - Vuex commit function.
     * @param {Array<Object>} features - The GeoJSON features to add to the map.
     * @returns {Promise<void>} A promise that resolves when the features have been added.
     */
    async addFeaturesToMap ({state, commit}, features) {
        let definedStyles = state.styles;

        if (Object.keys(definedStyles).length === 0) {
            const styles = await fetch(state.styleConf)
                .then(response => response.json());

            commit("setStyles", styles);
            definedStyles = styles;
        }

        const layerStyleObject = definedStyles.find(item => item.styleId === "belegenheiten"),
            geoJson = new GeoJSON();

        let featuresToMap = features;

        if (layerStyleObject) {
            const styledFeatures = features.map(feature => {
                const olFeature = geoJson.readFeature(feature),
                    style = createStyle.createStyle(layerStyleObject, olFeature, false, Config.wfsImgPath);

                olFeature.setStyle(style);
                olFeature.setId(feature.id);
                olFeature.set("featureId", feature.id); // Store as property backup

                return olFeature;
            });

            featuresToMap = styledFeatures;
        }

        let layer;

        if (typeof layerCollection.getLayerById("Module/landRegistryFile/layer/belegenheiten") !== "undefined") {
            layer = layerCollection.getLayerById("Module/landRegistryFile/layer/belegenheiten");
        }
        else {
            layer = layerFactory.createLayer({
                typ: "VECTORBASE",
                id: "Module/landRegistryFile/layer/belegenheiten",
                name: "Module/landRegistryFile/layer/belegenheiten",
                alwaysOnTop: true,
                renderer: "webgl"
            });

            layerCollection.addLayer(layer);
        }

        layer.layer.getSource().clear();
        layer.layer.getSource().addFeatures(featuresToMap);
    },
    /**
     * Adds or removes the selected features to/from the given selection layer and creates it if needed.
     * @param {Object} context Vuex action context.
     * @param {Function} context.commit Vuex commit function.
     * @param {Function} context.dispatch Vuex dispatch function.
     * @param {Array} features - The OpenLayers features to display as selection.
     * @param {string} layerName - The name of the selection layer.
     * @param {boolean} fromMap - Indicates if the selection change originated from a map interaction.
     * @returns {Promise<void>} Resolves after the selected features have been added to the layer.
     */
    async updateSelectionLayer ({commit, dispatch}, {features, layerName, fromMap = false}) {
        const map = mapCollection.getMap("2D");

        if (!map) {
            return;
        }

        commit("setSelectionFromMap", fromMap);

        if (!features || features.length === 0) {
            commit("setMapFeaturesSelected", []);
        }
        else {
            commit("setMapFeaturesSelected", features);
        }

        let selectionLayer = map.getLayers().getArray().find(l => l.get("name") === layerName);

        if (!selectionLayer) {
            selectionLayer = await dispatch("Maps/addNewLayerIfNotExists", {layerName: layerName, alwaysOnTop: true}, {root: true});
        }

        selectionLayer.getSource().clear();
        if (features && features.length > 0) {
            selectionLayer.getSource().addFeatures(features);
        }
    },
    /**
     * Loads the tour steps from the configured URL and starts the driver.js tour.
     * @returns {Promise<void>} Resolves after the tour has been started.
     */
    async startGuidedTour ({state, dispatch}) {
        const stepsUrl = state.landRegistryFileTourUrl,
            driverTourLibrary = window.driver?.js?.driver;

        if (!stepsUrl || !driverTourLibrary) {
            console.warn("The steps-URL or driver.js are not available.");

            dispatch("Alerting/addSingleAlert", {
                category: "error",
                content: "Die Hilfetour ist nicht verfügbar. Bitte nutzen Sie bei Bedarf das Kontaktformular in der linken Seitenspalte.",
                once: true
            }, {root: true});

            return;
        }

        try {
            const response = await fetch(stepsUrl);

            if (!response.ok) {
                throw new Error(`Unable to load tour configuration: ${response.status}`);
            }

            const config = await response.json();

            if (!Array.isArray(config.tourSteps)) {
                throw new Error("Tour configuration must contain a tourSteps array.");
            }

            driverTourLibrary({
                popoverClass: "landregistry-guided-tour",
                steps: config.tourSteps.map(({id, ...step}) => ({
                    ...step,
                    popover: {
                        ...step.popover,
                        popoverClass: `landregistry-guided-tour landregistry-tour-${id}`
                    }
                }))
            }).drive();
        }
        catch (error) {
            dispatch("Alerting/addSingleAlert", {
                category: "error",
                content: "Die Hilfetour ist nicht verfügbar. Bitte nutzen Sie bei Bedarf das Kontaktformular in der linken Seitenspalte.",
                once: true
            }, {root: true});

            console.error(error);
        }
    },
    /**
     * Selects a feature on the map and zooms to it.
     * @param {Object} context Vuex action context.
     * @param {Function} context.dispatch Vuex dispatch function.
     * @param {Object} payload Action payload.
     * @param {string|number} payload.featureId ID of the feature to select.
     * @param {boolean} payload.zoomToFeature - Whether to zoom to the selected feature.
     * @returns {void} Dispatches selection and zoom actions if the feature exists.
     */
    selectFeatureOnMap ({dispatch}, {featureId, zoomToFeature}) {
        const activeLayer = mapCollection.getMap("2D")?.getLayers()?.getArray()
            .find(l => l.get("name") === "Module/landRegistryFile/layer/belegenheiten");
        const source = activeLayer?.getSource();

        if (!source || source.getFeatures().length === 0) {
            return;
        }

        const feature = source?.getFeatureById(featureId);

        if (!feature) {
            return;
        }

        const clonedFeature = feature.clone();

        clonedFeature.setId(featureId);

        const selectionStyle = new Style({
            image: new Circle({
                radius: 5,
                fill: new Fill({color: "#03ffff"})
            })
        });

        clonedFeature.setStyle(selectionStyle);

        dispatch("updateSelectionLayer", {
            features: [clonedFeature],
            layerName: "Module/landRegistryFile/layer/selection"
        });

        if (zoomToFeature) {
            dispatch("zoomToSelectedFeature", {feature: clonedFeature});
        }
    },
    /**
     * Centers the map on the given coordinate, accounting for visible menus.
     * @param {Object} context - The Vuex action context.
     * @param {Function} context.dispatch Vuex dispatch function.
     * @param {Function} context.rootGetters Vuex rootGetters function.
     * @param {Object} payload - The action payload.
     * @param {Array<number>|null} payload.coord - The coordinate to center the map on.
     * @returns {void}
     */
    centerVisibleMap ({dispatch, rootGetters}, payload) {
        const coordinates = payload.coord;
        const map = mapCollection.getMap("2D"),
            pixelAtCoordinates = map?.getPixelFromCoordinate(coordinates);

        if (!map || !pixelAtCoordinates) {
            return;
        }

        const rightPadding = rootGetters["Menu/expanded"]("secondaryMenu")
                ? document.getElementById("mp-menu-secondaryMenu").offsetWidth + 20
                : 20,
            leftPadding = rootGetters["Menu/expanded"]("mainMenu")
                ? document.getElementById("mp-menu-mainMenu").offsetWidth + 20
                : 20,
            offset = (rightPadding - leftPadding) / 2,
            shiftedPixel = [pixelAtCoordinates[0] + offset, pixelAtCoordinates[1]],
            shiftedCoordinate = map.getCoordinateFromPixel(shiftedPixel);

        dispatch("Maps/setCenter", shiftedCoordinate, {root: true});
    },
    /**
     * Zooms to the selected feature and centers it in the visible map area.
     * @param {Object} context - The Vuex action context.
     * @param {Function} context.dispatch Vuex dispatch function.
     * @param {Function} context.commit Vuex commit function.
     * @param {Feature|null} feature - The feature to zoom to.
     * @returns {void}
     */
    zoomToSelectedFeature ({dispatch, commit}, {feature}) {
        if (feature) {
            const map = mapCollection.getMap("2D"),
                view = map?.getView(),
                setZoom = 7;

            if (!map || !view) {
                return;
            }

            commit("setOnCenterMap", true);

            if (view.getZoom() === setZoom) {
                dispatch("centerVisibleMap", {coord: feature.getGeometry().getCoordinates()});
            }
            else {
                /**
                 * onMoveEnd centers the map on the feature once the zoom animation has finished.
                 * @returns {void}
                 */
                function onMoveEnd () {
                    dispatch("centerVisibleMap", {coord: feature.getGeometry().getCoordinates()});
                    map.un("moveend", onMoveEnd);
                }

                map.on("moveend", onMoveEnd);
                view.setZoom(setZoom);
            }

            setTimeout(() => {
                commit("setOnCenterMap", false);
            }, 1000);

        }
    },
    /**
     * Removes the specified feature from the map selection layer.
     * @param {Object} context - The Vuex action context.
     * @param {Function} context.dispatch Vuex dispatch function.
     * @param {Object} context.state Vuex state object.
     * @param {string|number} featureId - The ID of the feature to deselect.
     * @returns {void}
     */
    deselectFeatureOnMap ({dispatch, state}, {featureId}) {
        const layerName = "Module/landRegistryFile/layer/selection",
            layer = mapCollection.getMap("2D")?.getLayers().getArray().find(l => l.get("name") === layerName),
            remaining = (layer?.getSource().getFeatures() || []).filter(f => f.getId() !== featureId);

        dispatch("updateSelectionLayer", {features: remaining, layerName, fromMap: state.selectionFromMap});
    }
};
