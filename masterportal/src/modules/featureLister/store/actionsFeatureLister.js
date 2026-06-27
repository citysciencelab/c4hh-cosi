import {getCenter} from "ol/extent.js";
import createLayerAddToTreeModule from "@shared/js/utils/createLayerAddToTree.js";
import tabStatus from "../constantsTabStatus.js";
import spatialSelection from "../js/getSpatialSelection.js";
import layerCollection from "@core/layers/js/layerCollection.js";

export default {
    /**
     * Click event that gets triggered when clicking on a row in the list view.
     * @param {Object} param.state the state
     * @param {Object} param.commit the commit
     * @param {Object} param.dispatch the dispatch
     * @param {Object} param.getters the getters
     * @param {Object} param.rootGetters the rootGetters
     * @param {String} row information of the selected row
     * @returns {void}
     */
    clickOnFeature ({state, commit, dispatch, getters, rootGetters}, row) {
        if (row && row.id) {
            const feature = getters.selectedFeature(row.id),
                featureGeometry = feature.getGeometry(),
                styleObj = getters.getGeometryType?.toLowerCase().indexOf("polygon") > -1 ? state.highlightVectorRulesPolygon : state.highlightVectorRulesPointLine;

            commit("setSelectedRow", row);
            dispatch("switchToDetails");

            if (styleObj && styleObj.zoomLevel) {
                if (featureGeometry && typeof featureGeometry.getType === "function") {
                    if (featureGeometry.getType() === "Point") {
                        dispatch("Maps/zoomToCoordinates", {center: featureGeometry.getCoordinates()}, {root: true});
                    }
                    else {
                        dispatch("Maps/zoomToCoordinates", {center: getCenter(featureGeometry.getExtent())}, {root: true});
                    }
                    dispatch("Maps/setZoom", styleObj.zoomLevel, {root: true});
                }
            }
            if (rootGetters.treeHighlightedFeatures?.active) {
                createLayerAddToTreeModule.createLayerAddToTree(state.layer.id, [feature], rootGetters.treeHighlightedFeatures);
            }
        }
    },
    /**
     * Hover event that gets triggered when hovering over a feature in the list view.
     * @param {Object} param.state the state
     * @param {Object} param.dispatch the dispatch
     * @param {Object} param.getters the getters
     * @param {String} row index of the clicked Feature
     * @returns {void}
     */
    hoverOverFeature ({dispatch, getters}, row) {
        if (row && row.id) {
            const feature = getters.selectedFeature(row.id);

            if (feature.getGeometry().getType() === "Point" || feature.getGeometry().getType() === "MultiPoint") {
                dispatch("Maps/placingPointMarker", feature.getGeometry().flatCoordinates, {root: true});
            }
            if (feature.getGeometry().getType() === "Polygon" || feature.getGeometry().getType() === "MultiPolygon") {
                dispatch("Maps/placingPolygonMarker", feature.getGeometry(), {root: true});
            }
            if (feature.getGeometry().getType() === "LineString" || feature.getGeometry().getType() === "MultiLineString") {
                dispatch("Maps/placingPointMarker", [feature.getGeometry().flatCoordinates[0], feature.getGeometry().flatCoordinates[1]], {root: true});
            }
        }
    },
    /**
     * Highlights an array of features depending on the geometryType.
     * @param {Object} param.state the state
     * @param {Object} param.dispatch the dispatch
     * @param {Object} param.getters the getters
     * @param {Object} param.rootGetters the rootGetters
     * @param {String} feature the feature to be highlighted.
     * @returns {void}
     */
    highlightSelectedFeatures ({state, dispatch, getters, rootGetters}, features) {
        const layer = layerCollection.getLayerById(state.layer.id),
            layerSourceFeatures = layer?.getLayerSource()?.getFeatures() || [],
            highlightedFeatureIds = new Set();

        for (const feature of features) {
            const featureCoords = feature.getGeometry?.()?.getCoordinates?.()?.toString(),
                sourceFeature = layerSourceFeatures.find(f => {
                    const coords = f.getGeometry?.()?.getCoordinates?.()?.toString();

                    return coords && coords === featureCoords;
                }),
                mapFeature = sourceFeature || (feature.getGeometry ? feature : getters.selectedFeature(feature.id_)),
                layerConfig = rootGetters.layerConfigById(state.layer.id),
                styleObj = getters.getGeometryType?.toLowerCase().indexOf("polygon") > -1 ? state.highlightVectorRulesPolygon : state.highlightVectorRulesPointLine;

            if (!mapFeature || !mapFeature.getGeometry) {
                console.warn("Feature could not be highlighted - no geometry found:", feature);
                continue;
            }
            const featureUid = mapFeature.ol_uid;

            if (highlightedFeatureIds.has(featureUid)) {
                continue;
            }
            highlightedFeatureIds.add(featureUid);

            const featureGeometryType = mapFeature.getGeometry().getType(),
                highlightObject = {
                    type: featureGeometryType === "Point" || featureGeometryType === "MultiPoint" ? "increase" : "highlightPolygon",
                    id: mapFeature.getId(),
                    layer: {id: state.layer.id},
                    feature: mapFeature,
                    scale: styleObj.image?.scale
                };

            if (featureGeometryType === "LineString") {
                highlightObject.type = "highlightLine";
            }
            if (styleObj.zoomLevel) {
                highlightObject.zoomLevel = styleObj.zoomLevel;
            }
            if (layerConfig && layerConfig.styleId) {
                highlightObject.styleId = layerConfig.styleId;
            }

            highlightObject.highlightStyle = {
                fill: styleObj.fill,
                stroke: styleObj.stroke,
                image: styleObj.image
            };
            dispatch("Maps/highlightFeature", highlightObject, {root: true});
        }
    },
    /**
     * Filters the features of the selected layer based on the drawn geometry.
     * @param {Object} param.state the state
     * @param {Object} param.dispatch the dispatch
     * @param {Object} param.getters the getters
     * @param {Object} param.rootGetters the rootGetters
     */
    filterGfiFeaturesOfLayer: async ({state, commit, dispatch, rootGetters, rootState}) => {
        const layers = rootGetters.visibleLayerConfigs,
            layer = layers.find(l => l.id === state.layer.id),
            selectedFeatures = await spatialSelection.getSpatialSelection(state.selectedArea, layer, rootState.Maps.projection.getCode(), {dispatch, commit});

        if (!selectedFeatures) {
            dispatch("Alerting/addSingleAlert", {
                category: "warning",
                content: i18next.t("common:modules.featureLister.requestFailedAlert")
            }, {root: true});
            commit("setGfiFeaturesOfLayer", []);
            commit("setFeatureCount", 0);
            commit("setShownFeatures", 0);
            return;
        }

        commit("setGfiFeaturesOfLayer", selectedFeatures);
        dispatch("highlightSelectedFeatures", selectedFeatures);
    },
    /**
     * Switches back to the feature list of the selected layer.
     * @param {Object} param.state the state
     * @param {Object} param.commit the commit
     * @returns {void}
     */
    switchBackToList ({state, commit}) {
        if (state.layer) {
            commit("setLayerListView", tabStatus.ENABLED);
            commit("setFeatureDetailView", tabStatus.ENABLED);
            commit("setFeatureListView", tabStatus.ACTIVE);
        }
    },
    /**
     * Switches to the feature list of the selected layer.
     * @param {Object} param.state the state
     * @param {Object} param.commit the commit
     * @param {Object} param.dispatch the dispatch
     * @param {Object} layer reduced selected layer, only contains name, id and geometryType
     * @returns {void}
     */
    switchToList: async ({state, commit, dispatch}) => {
        await dispatch("processGfiFeatures");

        const selectedArea = state.selectedArea,
            hasArea = selectedArea !== null;

        if (state.gfiFeaturesOfLayer.length === 0) {
            dispatch("Alerting/addSingleAlert", {
                category: "info",
                content: i18next.t(hasArea ? "common:modules.featureLister.noFeaturesFound" : "common:modules.featureLister.noFeaturesFoundInMap")
            }, {root: true});
            return;

        }
        commit("setFeatureCount", state.gfiFeaturesOfLayer.length);
        commit("setShownFeatures", state.gfiFeaturesOfLayer.length < state.maxFeatures ? state.gfiFeaturesOfLayer.length : state.maxFeatures);
        commit("setLayerListView", tabStatus.ENABLED);
        commit("setFeatureListView", tabStatus.ACTIVE);
        commit("setFeatureDetailView", tabStatus.DISABLED);
    },
    /**
     * Processes the GFI features of the selected layer depending on whether the user selected an area or not.
     * @param {Object} param.state the state
     * @param {Object} param.commit the commit
     * @param {Object} param.dispatch the dispatch
     */
    processGfiFeatures: async ({state, commit, dispatch}) => {
        if (state.layer) {
            if (state.selectedArea) {
                commit("setLoading", true);
                await dispatch("filterGfiFeaturesOfLayer");
                commit("setLoading", false);
            }
            else {
                commit("setGfiFeaturesOfLayer");
            }
        }
    },
    /**
     * Switches to the details list of the selected feature.
     * @param {Object} param.state the state
     * @param {Object} param.commit the commit
     * @param {Object} param.dispatch the dispatch
     * @returns {void}
     */
    switchToDetails ({state, commit}) {
        if (state.selectedRow !== null) {
            commit("setLayerListView", tabStatus.ENABLED);
            commit("setFeatureListView", tabStatus.ENABLED);
            commit("setFeatureDetailView", tabStatus.ACTIVE);
        }
    },
    /**
     * Switches to the themes list of all visible layers and resets the featureList and the selectedFeature.
     * @param {Object} param.commit the commit
     * @param {Object} param.dispatch the dispatch
     * @returns {void}
     */
    switchToThemes ({commit, dispatch}) {
        dispatch("Maps/removeHighlightFeature", "decrease", {root: true});
        dispatch("Maps/removePointMarker", null, {root: true});
        dispatch("Maps/removePolygonMarker", null, {root: true});
        commit("resetToThemeChooser");
    },
    /**
     * Expands the feature list to show more features.
     * @param {Object} param.state the state
     * @param {Object} param.commit the commit
     * @returns {void}
     */
    showMore ({state, commit}) {
        const numberOfFeaturesToShow = state.shownFeatures < state.featureCount - 10 ? state.shownFeatures + 10 : state.featureCount;

        commit("setShownFeatures", numberOfFeaturesToShow);
    }
};

