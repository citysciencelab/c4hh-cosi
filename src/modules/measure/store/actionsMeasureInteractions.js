import source from "../js/measureSource.js";
import {unByKey} from "ol/Observable.js";
import selectInteraction from "@masterportal/masterportalapi/src/maps/interactions/selectInteraction.js";
import getStyle from "../js/measureStyle.js";
import {createSelectInteractions, createMeasureModifyInteraction} from "../js/measureInteractions.js";
import {normalizeFeatureId} from "../js/measureUtils.js";

export default {
    /**
     * Removes all active OL edit interactions (draw, modify, select) and resets
     * the corresponding state. Safe to call when nothing is active.
     * @returns {void}
     */
    cleanupAllInteractions ({state, commit, dispatch}) {
        if (state.interaction) {
            dispatch("removeDrawInteraction");
        }
        if (state.currentModifyInteraction) {
            dispatch("Maps/removeInteraction", state.currentModifyInteraction, {root: true});
            commit("setCurrentModifyInteraction", null);
        }
        state.currentSelectInteractions.forEach(inter => {
            dispatch("Maps/removeInteraction", inter, {root: true});
        });
        commit("setCurrentSelectInteractions", []);
        commit("setSelectedEditInteraction", null);
        commit("setCurrentlyModifyingFeatureId", null);
    },

    /**
     * State machine for switching the tool between DRAW / MODIFY / DELETE / IDLE modes.
     * Always cleans up the previous mode first.
     * @param {Object} context - vuex action context
     * @param {Object} payload - {mode: String, featureId?: String|Number}
     * @returns {void}
     */
    setInteractionMode ({commit, dispatch}, {mode, featureId = null}) {
        dispatch("cleanupAllInteractions");

        if (mode === "DRAW") {
            commit("setSelectedEditInteraction", "");
            dispatch("createDrawInteraction");
        }
        else if (mode === "MODIFY") {
            commit("setSelectedEditInteraction", "modify");
            commit("setCurrentlyModifyingFeatureId", featureId);
            dispatch("setupModifyInteraction", featureId);
        }
        else if (mode === "DELETE") {
            commit("setSelectedEditInteraction", "delete");
            dispatch("setupDeleteInteraction");
        }
        else if (mode === "IDLE") {
            commit("setSelectedEditInteraction", "");
        }
    },

    /**
     * Creates OL select interactions for delete mode and adds them to the map.
     * After a feature is clicked-to-delete, switches back to DRAW mode.
     * @param {Object} context - vuex action context
     * @returns {void}
     */
    setupDeleteInteraction ({state, commit, dispatch}) {
        const interactions = createSelectInteractions(state.layer),
            selectInter = interactions[0],
            removeHandler = selectInter.on("select", evt => {
                if (evt.selected.length > 0) {
                    const featureId = evt.selected[0].ol_uid;

                    dispatch("deleteSingleFeature", featureId);
                    commit("removeFeatureHistory", normalizeFeatureId(featureId));
                    dispatch("setInteractionMode", {mode: "DRAW"});
                    unByKey(removeHandler);
                }
            });

        selectInteraction.removeSelectedFeature(selectInter, source);
        commit("setCurrentSelectInteractions", interactions);
        interactions.forEach(inter => dispatch("Maps/addInteraction", inter, {root: true}));
    },

    /**
     * Creates an OL modify interaction, optionally restricted to one feature.
     * Records pre-modification coordinates to enable undo.
     * @param {Object} context - vuex action context
     * @param {String|Number|null} featureId - Feature to restrict editing to; null = all
     * @returns {void}
     */
    setupModifyInteraction ({state, commit, dispatch, getters}, featureId = null) {
        if (state.currentModifyInteraction) {
            dispatch("Maps/removeInteraction", state.currentModifyInteraction, {root: true});
            commit("setCurrentModifyInteraction", null);
        }

        const interaction = createMeasureModifyInteraction(
            featureId,
            getters.getFeatureById,
            {
                onModifyStart: feature => dispatch("capturePreModifyCoords", feature),
                onModifyEnd: (feature, beforeCoords, afterCoords, geometryType) => {
                    const normalizedId = normalizeFeatureId(feature.ol_uid);

                    commit("initFeatureHistory", normalizedId);
                    commit("pushUndoEntry", {
                        normalizedId,
                        entry: {
                            mode: "modifyCoordinates",
                            timestamp: Date.now(),
                            data: {previousCoordinates: beforeCoords, newCoordinates: afterCoords, geometryType}
                        }
                    });
                    commit("clearRedoForFeature", normalizedId);
                    commit("addFeature", feature);
                }
            }
        );

        if (!interaction) {
            return;
        }
        commit("setCurrentModifyInteraction", interaction);
        dispatch("Maps/addInteraction", interaction, {root: true});
    },

    /**
     * Removes the last drawing if it has not been completed (called on unmount).
     * @param {Object} context - vuex action context
     * @returns {void}
     */
    removeIncompleteDrawing ({state}) {
        const feature = state.lines[state.featureId] || state.polygons[state.featureId];

        if (feature && feature.get("isBeingDrawn")) {
            const layerSource = state.layer.getSource();

            if (layerSource.getFeatures().length > 0) {
                layerSource.removeFeature(layerSource.getFeatures().slice(-1)[0]);
            }
        }
    },

    /**
     * Toggles modify mode for a measurement.
     * Exits modify mode if the feature is already being modified.
     * @param {Object} context - vuex action context
     * @param {String|Number} featureId - the feature to toggle
     * @returns {void}
     */
    handleModifyMeasurement ({state, dispatch}, featureId) {
        const normalizedTarget = normalizeFeatureId(featureId),
            normalizedCurrent = state.currentlyModifyingFeatureId
                ? normalizeFeatureId(state.currentlyModifyingFeatureId)
                : null;

        if (state.selectedEditInteraction === "modify" && normalizedCurrent === normalizedTarget) {
            dispatch("unhighlightFeature", featureId);
            dispatch("setInteractionMode", {mode: "DRAW"});
        }
        else {
            dispatch("setInteractionMode", {mode: "MODIFY", featureId});
        }
    },

    /**
     * Deletes a specific measurement and exits modify mode if it was active.
     * @param {Object} context - vuex action context
     * @param {String|Number} featureId - the feature to delete
     * @returns {void}
     */
    handleDeleteMeasurement ({state, commit, dispatch}, featureId) {
        dispatch("deleteSingleFeature", featureId);
        commit("removeFeatureHistory", normalizeFeatureId(featureId));
        if (state.selectedEditInteraction === "modify") {
            dispatch("setInteractionMode", {mode: "DRAW"});
        }
    },

    /**
     * Highlights a measurement feature on the map.
     * @param {Object} context - vuex action context
     * @param {String|Number} featureId - the feature to highlight
     * @returns {void}
     */
    highlightFeature ({getters}, featureId) {
        const feature = getters.getFeatureById(featureId);

        if (feature && !feature.get("_isHighlighted")) {
            feature.set("_originalStyle", feature.getStyle());
            feature.set("_isHighlighted", true);
            feature.setStyle(getStyle([0, 89, 255, 1]));
        }
    },

    /**
     * Removes the highlight from a measurement feature.
     * @param {Object} context - vuex action context
     * @param {String|Number} featureId - the feature to unhighlight
     * @returns {void}
     */
    unhighlightFeature ({state, getters}, featureId) {
        const feature = getters.getFeatureById(featureId);

        if (feature && feature.get("_isHighlighted")) {
            const originalStyle = feature.get("_originalStyle");

            feature.setStyle(originalStyle || getStyle(state.color));
            feature.unset("_originalStyle");
            feature.unset("_isHighlighted");
        }
    }
};
