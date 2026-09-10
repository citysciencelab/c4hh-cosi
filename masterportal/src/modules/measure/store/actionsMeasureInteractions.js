import {Collection} from "ol";
import {Modify} from "ol/interaction.js";
import {pointerMove} from "ol/events/condition.js";
import {unByKey} from "ol/Observable.js";
import source from "../js/measureSource.js";
import selectInteraction from "@masterportal/masterportalapi/src/maps/interactions/selectInteraction.js";
import modifyInteraction from "@masterportal/masterportalapi/src/maps/interactions/modifyInteraction.js";
import getStyle from "../js/measureStyle.js";
import {deepCloneCoords, normalizeFeatureId} from "../js/measureUtils.js";

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
        const clickInteraction = selectInteraction.createSelectInteraction(state.layer);
        const hoverInteraction = selectInteraction.createSelectInteraction(state.layer, pointerMove);
        const interactions = [clickInteraction, hoverInteraction];

        const removeHandler = clickInteraction.on("select", evt => {
            if (evt.selected.length > 0) {
                const featureId = evt.selected[0].ol_uid;

                dispatch("deleteSingleFeature", featureId);
                commit("removeFeatureHistory", normalizeFeatureId(featureId));
                dispatch("setInteractionMode", {mode: "DRAW"});
                unByKey(removeHandler);
            }
        });

        selectInteraction.removeSelectedFeature(clickInteraction, source);
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

        let interaction;
        const geometryChangeListeners = new Map();

        if (featureId) {
            const feature = getters.getFeatureById(featureId);

            if (!feature) {
                return;
            }
            interaction = new Modify({features: new Collection([feature])});
        }
        else {
            interaction = modifyInteraction.createModifyInteraction(source);
        }

        interaction.on("modifystart", event => {
            event.features.forEach(feature => {
                dispatch("capturePreModifyCoords", feature);

                const geometry = feature.getGeometry();
                // eslint-disable-next-line func-style
                const changeListener = () => {
                    dispatch("updateTooltipPositionForFeature", feature);
                    commit("incrementGeometryUpdateTrigger");
                };

                geometry.on("change", changeListener);
                geometryChangeListeners.set(feature.ol_uid, {geometry, changeListener});
            });
        });

        interaction.on("modifyend", event => {
            event.features.forEach(feature => {
                const listenerInfo = geometryChangeListeners.get(feature.ol_uid);

                if (listenerInfo) {
                    listenerInfo.geometry.un("change", listenerInfo.changeListener);
                    geometryChangeListeners.delete(feature.ol_uid);
                }

                const geometry = feature.getGeometry(),
                    geometryType = geometry.getType(),
                    beforeCoords = feature.get("_beforeModifyCoords");
                let afterCoords;

                if (geometryType === "LineString") {
                    afterCoords = geometry.getCoordinates();
                }
                else if (geometryType === "Polygon") {
                    afterCoords = geometry.getCoordinates()[0];
                }

                if (beforeCoords && afterCoords) {
                    const normalizedId = normalizeFeatureId(feature.ol_uid);

                    commit("initFeatureHistory", normalizedId);
                    commit("pushUndoEntry", {
                        normalizedId,
                        entry: {
                            mode: "modifyCoordinates",
                            timestamp: Date.now(),
                            data: {previousCoordinates: beforeCoords, newCoordinates: deepCloneCoords(afterCoords), geometryType}
                        }
                    });
                    commit("clearRedoForFeature", normalizedId);
                }

                commit("addFeature", feature);
                feature.unset("_beforeModifyCoords");
            });

            if (event.mapBrowserEvent) {
                event.mapBrowserEvent.stopPropagation();
            }
        });

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
