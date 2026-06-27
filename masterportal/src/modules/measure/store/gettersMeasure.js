import stateMeasure from "./stateMeasure.js";
import {calculateLineLengths, calculatePolygonAreas, formatLiveSketchValue} from "../js/measureCalculation.js";
import source from "../js/measureSource.js";
import {normalizeFeatureId} from "../js/measureUtils.js";
import {isFeatureGeometryValid, canUndoFeature, canRedoFeature} from "../js/measureHistory.js";

import {generateSimpleGetters} from "@shared/js/utils/generators.js";

const simpleGetters = {
    ...generateSimpleGetters(stateMeasure),

    /**
     * @param {Object} state measure store state
     * @param {Object} getters measure store getters
     * @param {Object} rootState root state
     * @param {Object} rootGetters root getters
     * @returns {String[]} options for measurement units
     */
    currentUnits ({selectedGeometry, lineStringUnits, polygonUnits}) {
        return selectedGeometry === "LineString"
            ? lineStringUnits
            : polygonUnits;
    },
    /**
     * Calculates the length of lines.
     * @param {Object} state measure store state
     * @param {Object} getters measure store getters
     * @param {Object} rootState root state
     * @param {Object} rootGetters root getters
     * @return {String[]} calculated display values
     */
    lineLengths ({lines, earthRadius, measurementAccuracy, selectedLineStringUnit, selectedGeometry, lineStringUnits}, getters, rootState, rootGetters) {
        return calculateLineLengths(
            rootGetters["Maps/projection"].getCode(),
            lines,
            earthRadius,
            measurementAccuracy,
            selectedLineStringUnit,
            selectedGeometry,
            lineStringUnits
        );
    },
    /**
     * Calculates the area of a polygon.
     * @param {Object} state measure store state
     * @param {Object} getters measure store getters
     * @param {Object} rootState root state
     * @param {Object} rootGetters root getters
     * @return {String[]} calculated display values
     */
    polygonAreas ({polygons, earthRadius, measurementAccuracy, selectedPolygonUnit, selectedGeometry, polygonUnits}, getters, rootState, rootGetters) {
        return calculatePolygonAreas(
            rootGetters["Maps/projection"].getCode(),
            polygons,
            earthRadius,
            measurementAccuracy,
            selectedPolygonUnit,
            selectedGeometry,
            polygonUnits
        );
    },

    urlParams: state => {
        const params = {
            selectedGeometry: state.selectedGeometry,
            selectedLineStringUnit: state.selectedLineStringUnit,
            selectedPolygonUnit: state.selectedPolygonUnit
        };

        return JSON.stringify(params);
    },

    /**
     * Returns a unified list of all completed measurements with metadata.
     * @param {Object} state measure store state
     * @param {Object} getters measure store getters
     * @returns {Array<Object>} List of measurements with id, type, displayValue, and customName
     */
    measurementList: ({lines, polygons, customNames}, getters) => {
        const measurements = [];

        Object.keys(lines).forEach(featureId => {
            measurements.push({
                id: featureId,
                type: "LineString",
                displayValue: getters.lineLengths[featureId] || "",
                customName: customNames[featureId] || null
            });
        });

        Object.keys(polygons).forEach(featureId => {
            measurements.push({
                id: featureId,
                type: "Polygon",
                displayValue: getters.polygonAreas[featureId] || "",
                customName: customNames[featureId] || null
            });
        });

        return measurements;
    },

    /**
     * Returns a function that finds a measurement feature in the OL source by ol_uid.
     * Reading geometryUpdateTrigger ensures this getter recomputes when OL geometry changes.
     * @param {Object} state measure store state
     * @returns {Function} (featureId: String|Number) => module:ol/Feature|undefined
     */
    getFeatureById (state) {
        state.geometryUpdateTrigger; // read to establish reactive dependency on OL geometry changes
        return featureId => {
            const normalizedId = normalizeFeatureId(featureId);

            return source.getFeatures().find(f => {
                return f.get("featureId") === undefined &&
                    normalizeFeatureId(f.ol_uid) === normalizedId;
            });
        };
    },

    /**
     * Filters out the active sketch and geometrically invalid features from the measurement list.
     * @param {Object} state measure store state
     * @param {Object} getters measure store getters
     * @returns {Array} Filtered measurement list
     */
    filteredMeasurementList (state, getters) {
        state.geometryUpdateTrigger; // reactive dependency for live geometry changes
        const currentSketchId = state.currentSketch
            ? normalizeFeatureId(state.currentSketch.ol_uid)
            : null;

        return getters.measurementList
            .filter(m => !currentSketchId || normalizeFeatureId(m.id) !== currentSketchId)
            .filter(m => isFeatureGeometryValid(getters.getFeatureById(m.id)));
    },

    /**
     * Enriches the filtered measurement list with per-feature canUndo/canRedo flags.
     * @param {Object} state measure store state
     * @param {Object} getters measure store getters
     * @returns {Array} Measurement list with canUndo/canRedo properties
     */
    enrichedMeasurementList (state, getters) {
        state.geometryUpdateTrigger; // reactive dependency for live geometry changes
        return getters.filteredMeasurementList.map(m => ({
            ...m,
            canUndo: canUndoFeature(state.featureHistories, m.id, getters.getFeatureById(m.id)),
            canRedo: canRedoFeature(state.featureHistories, m.id)
        }));
    },

    /**
     * Returns display info for the measurement currently being drawn, or null if not drawing.
     * @param {Object} state measure store state
     * @param {Object} getters measure store getters
     * @param {Object} rootState root state
     * @param {Object} rootGetters root getters
     * @returns {Object|null} {type, displayValue} or null
     */
    activeMeasurementInfo (state, getters, rootState, rootGetters) {
        state.geometryUpdateTrigger; // reactive dependency for live geometry changes
        if (!state.currentSketch) {
            return null;
        }
        const geometry = state.currentSketch.getGeometry();

        if (!geometry) {
            return null;
        }
        const type = geometry.getType();

        return {
            type,
            displayValue: formatLiveSketchValue(
                geometry,
                type,
                rootGetters["Maps/projection"].getCode(),
                state.lineStringUnits,
                state.selectedLineStringUnit,
                state.polygonUnits,
                state.selectedPolygonUnit
            )
        };
    },

    /**
     * Whether undo is possible during active drawing.
     * @param {Object} state measure store state
     * @returns {Boolean} True if at least one point has been placed
     */
    canUndoCurrentSketch (state) {
        state.geometryUpdateTrigger; // reactive dependency for live geometry changes
        if (!state.currentSketch) {
            return false;
        }
        const geometry = state.currentSketch.getGeometry();

        if (!geometry) {
            return false;
        }
        const geometryType = geometry.getType(),
            coords = geometryType === "LineString"
                ? geometry.getCoordinates()
                : geometry.getCoordinates()[0];

        return coords.length > 0;
    },

    /**
     * Whether redo is possible during active drawing.
     * @param {Object} state measure store state
     * @returns {Boolean} True if there are points in the drawing redo stack
     */
    canRedoCurrentSketch (state) {
        return state.currentSketch !== null && state.drawingPointHistory.length > 0;
    }
};

export default simpleGetters;
