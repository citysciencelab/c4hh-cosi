import {normalizeFeatureId} from "./measureUtils.js";

/**
 * Returns whether a feature's geometry has enough coordinates to be a valid displayed measurement.
 * @param {module:ol/Feature|undefined} feature - The measurement feature
 * @returns {Boolean} True if the feature geometry meets minimum coordinate requirements
 */
export function isFeatureGeometryValid (feature) {
    if (!feature) {
        return false;
    }
    const geometry = feature.getGeometry();

    if (!geometry) {
        return false;
    }
    const type = geometry.getType();

    if (type === "LineString") {
        return geometry.getCoordinates().length >= 2;
    }
    if (type === "Polygon") {
        return (geometry.getCoordinates()[0] || []).length >= 4;
    }
    return true;
}

/**
 * Returns whether undo is possible for a completed measurement feature.
 * Checks the explicit history stack first; falls back to geometry coordinate count.
 * @param {Object} featureHistories - Map of normalizedId → {undo: Array, redo: Array}
 * @param {String|Number} featureId - The feature ol_uid
 * @param {module:ol/Feature|undefined} feature - The OL feature (used for geometry fallback)
 * @returns {Boolean} True if undo is possible
 */
export function canUndoFeature (featureHistories, featureId, feature) {
    const normalizedId = normalizeFeatureId(featureId),
        history = featureHistories[normalizedId];

    if (history && history.undo.length > 0) {
        return true;
    }
    if (!feature) {
        return false;
    }
    const geometry = feature.getGeometry(),
        type = geometry.getType();

    if (type === "LineString") {
        return geometry.getCoordinates().length > 1;
    }
    if (type === "Polygon") {
        return (geometry.getCoordinates()[0] || []).length > 3;
    }
    return false;
}

/**
 * Returns whether redo is possible for a completed measurement feature.
 * @param {Object} featureHistories - Map of normalizedId → {undo: Array, redo: Array}
 * @param {String|Number} featureId - The feature ol_uid
 * @returns {Boolean} True if redo is possible
 */
export function canRedoFeature (featureHistories, featureId) {
    const normalizedId = normalizeFeatureId(featureId),
        history = featureHistories[normalizedId];

    return Boolean(history && history.redo.length > 0);
}

/**
 * Builds the initial undo history entries from a just-completed draw interaction.
 * Returns addPoint entries for all coordinates beyond the first two (which are implicit).
 * @param {module:ol/Feature} feature - The feature that was just finished drawing
 * @returns {Array} Array of history entries ready to push onto the undo stack
 */
export function buildDrawEndHistory (feature) {
    const geometry = feature.getGeometry(),
        geometryType = geometry.getType();
    let coordinates;

    if (geometryType === "LineString") {
        coordinates = geometry.getCoordinates();
    }
    else if (geometryType === "Polygon") {
        coordinates = geometry.getCoordinates()[0].slice(0, -1);
    }
    if (!coordinates || coordinates.length <= 2) {
        return [];
    }

    const entries = [];

    for (let i = 2; i < coordinates.length; i++) {
        entries.push({
            mode: "addPoint",
            timestamp: Date.now(),
            data: {point: coordinates[i], pointIndex: i, geometryType}
        });
    }
    return entries;
}

/**
 * Synthesizes an undo history entry for a feature that has no explicit history record.
 * Computes the entry from the feature's current geometry state.
 * @param {module:ol/Feature} feature - The feature to synthesize an entry for
 * @returns {Object|null} A synthetic addPoint history entry, or null if undo is not possible
 */
export function createSyntheticUndoEntry (feature) {
    const geometry = feature.getGeometry(),
        geometryType = geometry.getType();

    if (geometryType === "LineString") {
        const coordinates = geometry.getCoordinates();

        if (coordinates.length <= 1) {
            return null;
        }
        return {
            mode: "addPoint",
            timestamp: Date.now(),
            data: {point: coordinates[coordinates.length - 1], pointIndex: coordinates.length - 1, geometryType}
        };
    }
    if (geometryType === "Polygon") {
        const coordinates = geometry.getCoordinates()[0];

        if (coordinates.length <= 3) {
            return null;
        }
        return {
            mode: "addPoint",
            timestamp: Date.now(),
            data: {point: coordinates[coordinates.length - 2], pointIndex: coordinates.length - 2, geometryType}
        };
    }
    return null;
}
