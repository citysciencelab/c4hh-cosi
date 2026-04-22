import source from "../js/measureSource.js";
import makeDraw2d from "../js/measureDraw.js";
import makeDraw3d from "../js/measureDraw3d.js";
import changeCase from "@shared/js/utils/changeCase.js";
import {normalizeFeatureId} from "../js/measureUtils.js";
import {buildDrawEndHistory} from "../js/measureHistory.js";
import actionsMeasureInteractions from "./actionsMeasureInteractions.js";
import actionsMeasureUndoRedo from "./actionsMeasureUndoRedo.js";

export default {
    /**
     * Deletes all geometries from the measure layer,
     * and removes belonging UI/state.
     * @return {void}
     */
    deleteFeatures ({state, commit}) {
        const {unlisteners, interaction} = state;

        if (interaction) {
            interaction.abortDrawing();
        }
        unlisteners.forEach(unlistener => unlistener());
        source.clear();

        commit("setLines", {});
        commit("setPolygons", {});
        commit("setCustomNames", {});
        commit("setUnlisteners", []);
    },
    /**
     * Creates a new draw interaction depending on state to either draw
     * lines or polygons. The method will first remove any prior draw
     * interaction created by this tool.
     * @returns {void}
     */
    createDrawInteraction ({state, dispatch, commit, getters, rootGetters}) {
        dispatch("removeDrawInteraction");

        let interaction = null;

        if (rootGetters["Maps/mode"] === "3D") {
            dispatch("deleteFeatures");
            interaction = makeDraw3d();
        }
        else {
            if (getters.unlisteners.length) {
                // if unlisteners are registered, this indicates 3D mode was active immediately before
                dispatch("deleteFeatures");
            }
            const {selectedGeometry} = state;

            interaction = makeDraw2d(
                {state},
                selectedGeometry,
                feature => commit("addFeature", feature),
                flag => commit("setIsDrawing", flag),
                featureId => commit("setFeatureId", featureId),
                tooltipCoord => commit("setTooltipCoord", tooltipCoord)
            );

            interaction.on("drawstart", evt => {
                commit("setCurrentSketch", evt.feature);
                commit("setDrawingPointHistory", []);
                commit("incrementGeometryUpdateTrigger");

                const geometry = evt.feature.getGeometry();

                if (geometry) {
                    geometry.on("change", () => {
                        commit("incrementGeometryUpdateTrigger");
                    });
                }
            });

            interaction.on("drawend", evt => {
                const featureId = evt.feature.ol_uid,
                    normalizedId = normalizeFeatureId(featureId),
                    entries = buildDrawEndHistory(evt.feature);

                commit("initFeatureHistory", normalizedId);
                entries.forEach(entry => commit("pushUndoEntry", {normalizedId, entry}));
                commit("clearRedoForFeature", normalizedId);
                commit("setCurrentSketch", null);
                commit("setDrawingPointHistory", []);
            });

            dispatch("Maps/addInteraction", interaction, {root: true});
        }

        commit("setInteraction", interaction);
    },
    /**
     * Removes the draw interaction. This includes aborting any current
     * unfinished drawing, removing the interaction from the map, and
     * removing the interaction from the store.
     * @returns {void}
     */
    removeDrawInteraction ({state, dispatch, commit}) {
        const {interaction} = state;

        if (interaction) {
            interaction.abortDrawing();

            if (interaction.interaction3d) {
                // 3d interaction is not directly added to map, but provides its own method
                interaction.stopInteraction();
            }
            else {
                dispatch("Maps/removeInteraction", interaction, {root: true});
            }

            commit("setInteraction", null);
        }
    },

    urlParams ({commit}, params) {
        Object.keys(params).forEach(key => {
            commit(`set${changeCase.upperFirst(key)}`, params[key]);
        });
    },

    /**
     * Removes tooltip/label features from the source for a given measurement.
     * @param {Object} _ - unused vuex context
     * @param {String|Number} featureId - The ol_uid of the measurement feature
     * @returns {void}
     */
    removeTooltipForFeature (_, featureId) {
        const normalizedId = normalizeFeatureId(featureId),
            featuresToRemove = [];

        source.forEachFeature(f => {
            const tooltipId = f.get("featureId");

            if (tooltipId !== undefined && normalizeFeatureId(tooltipId) === normalizedId) {
                featuresToRemove.push(f);
            }
        });
        featuresToRemove.forEach(f => source.removeFeature(f));
    },

    /**
     * Updates the tooltip position for a feature to reflect its last coordinate.
     * Also syncs tooltipCoord in the store so that MeasureInMapTooltip's watcher
     * does not override the updated position on reactive recalculation.
     * @param {Object} context - vuex action context
     * @param {module:ol/Feature} feature - The measurement feature
     * @returns {void}
     */
    updateTooltipPositionForFeature ({state, commit}, feature) {
        const normalizedFeatureId = normalizeFeatureId(feature.ol_uid),
            geometry = feature.getGeometry(),
            geometryType = geometry.getType();
        let newCoord = null;

        if (geometryType === "LineString") {
            newCoord = geometry.getLastCoordinate();
        }
        else if (geometryType === "Polygon") {
            const coordinates = geometry.getCoordinates()[0];

            newCoord = coordinates[coordinates.length - 2];
        }

        if (!newCoord) {
            return;
        }

        source.forEachFeature(f => {
            const tooltipFeatureId = f.get("featureId");

            if (tooltipFeatureId !== undefined && normalizeFeatureId(tooltipFeatureId) === normalizedFeatureId) {
                const tooltipGeometry = f.getGeometry();

                if (tooltipGeometry && tooltipGeometry.getType() === "Point") {
                    tooltipGeometry.setCoordinates(newCoord);
                }
            }
        });

        // If this feature is the last drawn feature tracked by MeasureInMapTooltip
        // via currentTextPoint, we must also update tooltipCoord so that the
        // setValueAtTooltipLayer watcher does not move the tooltip back to its
        // old position when lineLengths/polygonAreas recompute.
        if (normalizeFeatureId(state.featureId) === normalizedFeatureId) {
            commit("setTooltipCoord", newCoord);
        }
    },

    /**
     * Deletes a single measurement feature from the source and the store.
     * Also removes the associated tooltip and custom name.
     * @param {Object} context - vuex action context
     * @param {String|Number} featureId - The ol_uid of the feature to delete
     * @returns {void}
     */
    deleteSingleFeature ({commit, dispatch}, featureId) {
        const normalizedId = normalizeFeatureId(featureId),
            allFeatures = source.getFeatures(),
            feature = allFeatures.find(f => {
                const isTooltip = f.get("featureId") !== undefined;

                return !isTooltip && normalizeFeatureId(f.ol_uid) === normalizedId;
            });

        if (feature) {
            dispatch("removeTooltipForFeature", featureId);
            source.removeFeature(feature);
            commit("removeFeature", feature.ol_uid);
        }
    },

    ...actionsMeasureInteractions,
    ...actionsMeasureUndoRedo
};
