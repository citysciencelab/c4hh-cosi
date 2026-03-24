/**
 * Normalizes a feature ID to Number type for consistent comparison.
 * @param {String|Number} id - The feature ID
 * @returns {Number} Normalized feature ID as a Number
 */
export function normalizeFeatureId (id) {
    return typeof id === "string" ? parseInt(id, 10) : id;
}

/**
 * Deep clones an array of coordinates.
 * Uses structuredClone when available, falls back to JSON parse/stringify.
 * @param {Array} coords - The coordinate array to clone
 * @returns {Array} Deep cloned array, or the original value if not an array
 */
export function deepCloneCoords (coords) {
    if (!coords || !Array.isArray(coords)) {
        return coords;
    }
    if (typeof structuredClone === "function") {
        return structuredClone(coords);
    }
    return JSON.parse(JSON.stringify(coords));
}

/**
 * Finds the coordinate that was removed when comparing two coordinate arrays.
 * @param {Array} before - Coordinate array before the removal
 * @param {Array} after - Coordinate array after the removal
 * @returns {Array|null} The removed coordinate, or null if no removal was detected
 */
export function findRemovedPoint (before, after) {
    if (!before || !after || !Array.isArray(before) || !Array.isArray(after)) {
        return null;
    }
    if (before.length <= after.length) {
        return null;
    }
    for (let i = 0; i < before.length; i++) {
        if (i >= after.length) {
            return before[i];
        }
        if (before[i][0] !== after[i][0] || before[i][1] !== after[i][1]) {
            return before[i];
        }
    }
    return null;
}
