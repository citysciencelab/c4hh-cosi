import source from "../js/measureSource.js";
import {normalizeFeatureId, deepCloneCoords, findRemovedPoint} from "../js/measureUtils.js";
import {createSyntheticUndoEntry} from "../js/measureHistory.js";

export default {
    /**
     * Undoes a point addition on a completed feature.
     * Removes the last point from the geometry; deletes the feature if too few points remain.
     * @param {Object} context - vuex action context
     * @param {Object} payload - {feature: ol/Feature, historyEntry: Object}
     * @returns {void}
     */
    undoPointOnFeature ({commit, dispatch}, {feature, historyEntry}) {
        const {geometryType, pointIndex} = historyEntry.data,
            geometry = feature.getGeometry(),
            featureId = feature.ol_uid;

        if (geometryType === "LineString") {
            const coordinates = geometry.getCoordinates();

            if (coordinates.length > 1 && pointIndex >= 0 && pointIndex < coordinates.length) {
                coordinates.splice(pointIndex, 1);
                if (coordinates.length === 1) {
                    dispatch("deleteSingleFeature", featureId);
                    return;
                }
                geometry.setCoordinates(coordinates);
            }
            else {
                return;
            }
        }
        else if (geometryType === "Polygon") {
            const coordinates = geometry.getCoordinates()[0];

            if (coordinates.length > 3 && pointIndex >= 0 && pointIndex < coordinates.length - 1) {
                coordinates.splice(pointIndex, 1);
                if (coordinates.length < 4) {
                    dispatch("deleteSingleFeature", featureId);
                    return;
                }
                geometry.setCoordinates([coordinates]);
            }
            else {
                dispatch("deleteSingleFeature", featureId);
                return;
            }
        }

        commit("addFeature", feature);
        dispatch("updateTooltipPositionForFeature", feature);
    },

    /**
     * Redoes a point addition on a completed feature.
     * Adds back a previously removed point to the geometry.
     * @param {Object} context - vuex action context
     * @param {Object} payload - {feature: ol/Feature, historyEntry: Object}
     * @returns {void}
     */
    redoPointOnFeature ({commit, dispatch}, {feature, historyEntry}) {
        const {point, geometryType} = historyEntry.data,
            geometry = feature.getGeometry();

        if (geometryType === "LineString") {
            const coordinates = geometry.getCoordinates();

            coordinates.push(point);
            geometry.setCoordinates(coordinates);
        }
        else if (geometryType === "Polygon") {
            const coordinates = geometry.getCoordinates()[0];

            coordinates.splice(coordinates.length - 1, 0, point);
            geometry.setCoordinates([coordinates]);
        }

        commit("addFeature", feature);
        dispatch("updateTooltipPositionForFeature", feature);
    },

    /**
     * Undoes a coordinate modification by restoring the previous coordinates.
     * @param {Object} context - vuex action context
     * @param {Object} payload - {feature: ol/Feature, historyEntry: Object}
     * @returns {void}
     */
    undoModifyCoordinates ({commit, dispatch}, {feature, historyEntry}) {
        const {previousCoordinates, geometryType} = historyEntry.data,
            geometry = feature.getGeometry();

        if (geometryType === "LineString") {
            geometry.setCoordinates(previousCoordinates);
        }
        else if (geometryType === "Polygon") {
            geometry.setCoordinates([previousCoordinates]);
        }

        commit("addFeature", feature);
        dispatch("updateTooltipPositionForFeature", feature);
    },

    /**
     * Redoes a coordinate modification by applying the new coordinates.
     * @param {Object} context - vuex action context
     * @param {Object} payload - {feature: ol/Feature, historyEntry: Object}
     * @returns {void}
     */
    redoModifyCoordinates ({commit, dispatch}, {feature, historyEntry}) {
        const {newCoordinates, geometryType} = historyEntry.data,
            geometry = feature.getGeometry();

        if (geometryType === "LineString") {
            geometry.setCoordinates(newCoordinates);
        }
        else if (geometryType === "Polygon") {
            geometry.setCoordinates([newCoordinates]);
        }

        commit("addFeature", feature);
        dispatch("updateTooltipPositionForFeature", feature);
    },

    /**
     * Records the pre-modification coordinates of a feature before a modify interaction starts.
     * @param {Object} _ - unused vuex context
     * @param {module:ol/Feature} feature - The feature about to be modified
     * @returns {void}
     */
    capturePreModifyCoords (_, feature) {
        const geometry = feature.getGeometry(),
            geometryType = geometry.getType();
        let coords;

        if (geometryType === "LineString") {
            coords = geometry.getCoordinates();
        }
        else if (geometryType === "Polygon") {
            coords = geometry.getCoordinates()[0];
        }

        try {
            feature.set("_beforeModifyCoords", deepCloneCoords(coords));
        }
        catch (error) {
            console.warn("measureUndoRedo: deepCloneCoords failed, using reference copy.", error);
            feature.set("_beforeModifyCoords", coords);
        }
    },

    /**
     * Clears all measurements and resets all undo/redo history.
     * @param {Object} context - vuex action context
     * @returns {void}
     */
    regulateDeleteAll ({commit, dispatch}) {
        dispatch("cleanupAllInteractions");
        commit("clearAllFeatureHistories");
        commit("setCurrentSketch", null);
        commit("setDrawingPointHistory", []);
        dispatch("deleteFeatures");
        dispatch("createDrawInteraction");
    },

    /**
     * Ensures every entry in measurementList has a featureHistories slot.
     * Called from the measurementList watcher in the Vue component.
     * @param {Object} context - vuex action context
     * @param {Array} measurementList - current measurement list
     * @returns {void}
     */
    syncFeatureHistories ({commit}, measurementList) {
        measurementList.forEach(m => {
            commit("initFeatureHistory", normalizeFeatureId(m.id));
        });
    },

    /**
     * Top-level undo dispatcher for a feature.
     * During active drawing it undoes the last placed point.
     * For completed features it reverts the last history entry.
     * @param {Object} context - vuex action context
     * @param {String|Number} featureId - the feature to undo
     * @returns {void}
     */
    regulateUndo ({state, commit, dispatch, getters}, featureId) {
        if (state.currentSketch &&
            normalizeFeatureId(state.currentSketch.ol_uid) === normalizeFeatureId(featureId)) {
            dispatch("undoLastPointInSketch");
            return;
        }

        const normalizedId = normalizeFeatureId(featureId),
            history = state.featureHistories[normalizedId],
            feature = getters.getFeatureById(featureId);

        if (!feature) {
            return;
        }

        if (!history || history.undo.length === 0) {
            dispatch("undoInitialPoint", {feature, normalizedId});
            return;
        }

        const historyEntry = history.undo[history.undo.length - 1];

        commit("popUndoEntry", normalizedId);

        if (historyEntry.mode === "addPoint") {
            dispatch("undoPointOnFeature", {feature, historyEntry});
        }
        else if (historyEntry.mode === "modifyCoordinates") {
            dispatch("undoModifyCoordinates", {feature, historyEntry});
        }

        commit("pushRedoEntry", {normalizedId, entry: historyEntry});
    },

    /**
     * Undoes the initial point of a feature that has no explicit history.
     * Synthesizes an entry from the current geometry state.
     * @param {Object} context - vuex action context
     * @param {Object} payload - {feature: ol/Feature, normalizedId: Number}
     * @returns {void}
     */
    undoInitialPoint ({commit, dispatch}, {feature, normalizedId}) {
        const syntheticEntry = createSyntheticUndoEntry(feature);

        if (syntheticEntry) {
            commit("initFeatureHistory", normalizedId);
            dispatch("undoPointOnFeature", {feature, historyEntry: syntheticEntry});
            commit("pushRedoEntry", {normalizedId, entry: syntheticEntry});
        }
    },

    /**
     * Top-level redo dispatcher for a feature.
     * During active drawing it re-adds the last undone point.
     * For completed features it reapplies the last undone history entry.
     * @param {Object} context - vuex action context
     * @param {String|Number} featureId - the feature to redo
     * @returns {void}
     */
    regulateRedo ({state, commit, dispatch, getters}, featureId) {
        if (state.currentSketch &&
            normalizeFeatureId(state.currentSketch.ol_uid) === normalizeFeatureId(featureId)) {
            dispatch("redoLastPointInSketch");
            return;
        }

        const normalizedId = normalizeFeatureId(featureId),
            history = state.featureHistories[normalizedId],
            feature = getters.getFeatureById(featureId);

        if (!feature || !history || history.redo.length === 0) {
            return;
        }

        const historyEntry = history.redo[history.redo.length - 1];

        commit("popRedoEntry", normalizedId);

        if (historyEntry.mode === "addPoint") {
            dispatch("redoPointOnFeature", {feature, historyEntry});
        }
        else if (historyEntry.mode === "modifyCoordinates") {
            dispatch("redoModifyCoordinates", {feature, historyEntry});
        }

        commit("pushUndoEntry", {normalizedId, entry: historyEntry});
    },

    /**
     * Removes the last point from the active sketch using the OL Draw interaction.
     * Aborts the drawing if too few points remain.
     * @param {Object} context - vuex action context
     * @returns {void}
     */
    undoLastPointInSketch ({state, commit, dispatch}) {
        if (!state.currentSketch || !state.interaction) {
            return;
        }
        const geometry = state.currentSketch.getGeometry();

        if (!geometry) {
            return;
        }

        const geometryType = geometry.getType(),
            coordinatesBefore = geometryType === "LineString"
                ? geometry.getCoordinates()
                : geometry.getCoordinates()[0],
            minPoints = geometryType === "LineString" ? 1 : 2;

        if (coordinatesBefore.length <= minPoints) {
            commit("setDrawingPointHistory", [
                ...state.drawingPointHistory,
                {type: "point", coord: coordinatesBefore[0]}
            ]);
            dispatch("abortCurrentDrawing");
            return;
        }

        try {
            state.interaction.removeLastPoint();

            const coordinatesAfter = geometryType === "LineString"
                    ? geometry.getCoordinates()
                    : geometry.getCoordinates()[0],
                minValidPoints = geometryType === "LineString" ? 2 : 3;

            if (coordinatesAfter.length <= minValidPoints) {
                const updatedHistory = [...state.drawingPointHistory];

                coordinatesAfter.forEach(coord => updatedHistory.push({type: "point", coord}));
                commit("setDrawingPointHistory", updatedHistory);
                dispatch("abortCurrentDrawing");
                return;
            }

            const removedPoint = findRemovedPoint(coordinatesBefore, coordinatesAfter);

            if (removedPoint) {
                commit("setDrawingPointHistory", [
                    ...state.drawingPointHistory,
                    {type: "point", coord: removedPoint}
                ]);
            }
        }
        catch (error) {
            console.warn("measureUndoRedo: removeLastPoint failed.", error);
        }
    },

    /**
     * Re-adds the last undone point to the active sketch.
     * @param {Object} context - vuex action context
     * @returns {void}
     */
    redoLastPointInSketch ({state, commit}) {
        if (!state.currentSketch || !state.interaction || state.drawingPointHistory.length === 0) {
            return;
        }

        const lastEntry = state.drawingPointHistory[state.drawingPointHistory.length - 1];

        if (!lastEntry || lastEntry.type !== "point") {
            return;
        }

        commit("setDrawingPointHistory", state.drawingPointHistory.slice(0, -1));

        const geometry = state.currentSketch.getGeometry(),
            geometryType = geometry.getType();

        if (typeof state.interaction.appendCoordinates === "function") {
            try {
                state.interaction.appendCoordinates([lastEntry.coord]);
                return;
            }
            catch (error) {
                console.warn("measureUndoRedo: appendCoordinates failed, falling back to manual insertion.", error);
            }
        }

        if (geometryType === "LineString") {
            const coordinates = geometry.getCoordinates();

            coordinates.push(lastEntry.coord);
            geometry.setCoordinates(coordinates);
        }
        else if (geometryType === "Polygon") {
            const coordinates = geometry.getCoordinates()[0];

            coordinates.splice(coordinates.length - 1, 0, lastEntry.coord);
            geometry.setCoordinates([coordinates]);
        }

        geometry.changed();
    },

    /**
     * Aborts the current drawing and removes the incomplete sketch from the source.
     * @param {Object} context - vuex action context
     * @returns {void}
     */
    abortCurrentDrawing ({state, commit, dispatch}) {
        if (state.currentSketch) {
            dispatch("removeTooltipForFeature", state.currentSketch.ol_uid);
            source.removeFeature(state.currentSketch);
            commit("removeFeature", state.currentSketch.ol_uid);
        }
        if (state.interaction) {
            try {
                state.interaction.abortDrawing();
            }
            catch (error) {
                console.warn("measureUndoRedo: abortDrawing failed.", error);
            }
        }
        commit("setCurrentSketch", null);
        commit("setDrawingPointHistory", []);
    }
};
