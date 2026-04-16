import {generateSimpleMutations} from "@shared/js/utils/generators.js";
import stateMeasure from "./stateMeasure.js";

const mutations = {
    ...generateSimpleMutations(stateMeasure),
    /**
     * Adds a feature depending on the currently selected geometry style to either
     * the lines or the polygons object by key. Features cannot be added multiple
     * times by design. To trigger an update regarding the feature, re-add it.
     * @param {Object} state vuex state
     * @param {module:ol/Feature} payload feature to add
     * @returns {void}
     */
    addFeature (state, payload) {
        const geometryType = payload.getGeometry ? payload.getGeometry().getType() : state.selectedGeometry,
            key = geometryType === "LineString" ? "lines" : "polygons";

        state[key] = {
            ...state[key],
            [payload.ol_uid]: payload
        };
    },
    /**
     * Removes a feature from both lines and polygons objects.
     * Also removes any associated custom name.
     * @param {Object} state vuex state
     * @param {String|Number} featureId - The ol_uid of the feature to remove
     * @returns {void}
     */
    removeFeature (state, featureId) {
        const normalizedId = String(featureId);

        if (state.lines[normalizedId]) {
            const newLines = {...state.lines};

            delete newLines[normalizedId];
            state.lines = newLines;
        }
        if (state.polygons[normalizedId]) {
            const newPolygons = {...state.polygons};

            delete newPolygons[normalizedId];
            state.polygons = newPolygons;
        }
        if (state.customNames[normalizedId]) {
            const newCustomNames = {...state.customNames};

            delete newCustomNames[normalizedId];
            state.customNames = newCustomNames;
        }
    },
    /**
     * Sets a custom display name for a measurement feature.
     * @param {Object} state vuex state
     * @param {Object} payload - {featureId: String|Number, name: String}
     * @returns {void}
     */
    setCustomName (state, payload) {
        const normalizedId = String(payload.featureId);

        state.customNames = {
            ...state.customNames,
            [normalizedId]: payload.name
        };
    },
    /**
     * Adds an unlisten function to the unlisteners array.
     * @param {Object} state vuex state
     * @param {function} payload added unlisten function
     * @returns {void}
     */
    addUnlistener (state, payload) {
        state.unlisteners = [...state.unlisteners, payload];
    },

    // ── Feature-history mutations ──────────────────────────────────────────────

    /**
     * Ensures a history entry exists for the given normalizedId.
     * @param {Object} state vuex state
     * @param {Number} normalizedId - normalizeFeatureId() result
     * @returns {void}
     */
    initFeatureHistory (state, normalizedId) {
        if (!state.featureHistories[normalizedId]) {
            state.featureHistories = {
                ...state.featureHistories,
                [normalizedId]: {undo: [], redo: []}
            };
        }
    },

    /**
     * Removes the history entry for the given normalizedId.
     * @param {Object} state vuex state
     * @param {Number} normalizedId - normalizeFeatureId() result
     * @returns {void}
     */
    removeFeatureHistory (state, normalizedId) {
        const remaining = {...state.featureHistories};

        delete remaining[normalizedId];
        state.featureHistories = remaining;
    },

    /**
     * Deletes all feature history entries.
     * @param {Object} state vuex state
     * @returns {void}
     */
    clearAllFeatureHistories (state) {
        state.featureHistories = {};
    },

    /**
     * Pushes an entry onto the undo stack for the given feature.
     * @param {Object} state vuex state
     * @param {Object} payload - {normalizedId: Number, entry: Object}
     * @returns {void}
     */
    pushUndoEntry (state, {normalizedId, entry}) {
        const history = state.featureHistories[normalizedId];

        if (history) {
            history.undo = [...history.undo, entry];
        }
    },

    /**
     * Removes the last entry from the undo stack for the given feature.
     * @param {Object} state vuex state
     * @param {Number} normalizedId - normalizeFeatureId() result
     * @returns {void}
     */
    popUndoEntry (state, normalizedId) {
        const history = state.featureHistories[normalizedId];

        if (history && history.undo.length > 0) {
            history.undo = history.undo.slice(0, -1);
        }
    },

    /**
     * Pushes an entry onto the redo stack for the given feature.
     * @param {Object} state vuex state
     * @param {Object} payload - {normalizedId: Number, entry: Object}
     * @returns {void}
     */
    pushRedoEntry (state, {normalizedId, entry}) {
        const history = state.featureHistories[normalizedId];

        if (history) {
            history.redo = [...history.redo, entry];
        }
    },

    /**
     * Removes the last entry from the redo stack for the given feature.
     * @param {Object} state vuex state
     * @param {Number} normalizedId - normalizeFeatureId() result
     * @returns {void}
     */
    popRedoEntry (state, normalizedId) {
        const history = state.featureHistories[normalizedId];

        if (history && history.redo.length > 0) {
            history.redo = history.redo.slice(0, -1);
        }
    },

    /**
     * Clears the redo stack for the given feature.
     * @param {Object} state vuex state
     * @param {Number} normalizedId - normalizeFeatureId() result
     * @returns {void}
     */
    clearRedoForFeature (state, normalizedId) {
        const history = state.featureHistories[normalizedId];

        if (history) {
            history.redo = [];
        }
    },

    /**
     * Increments geometryUpdateTrigger to force reactive recomputation of
     * geometry-dependent getters when OL geometry changes non-reactively.
     * @param {Object} state vuex state
     * @returns {void}
     */
    incrementGeometryUpdateTrigger (state) {
        state.geometryUpdateTrigger++;
    }
};

export default mutations;
