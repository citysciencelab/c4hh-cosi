/**
 * Utility functions for geometry processing in CombinedGfi
 */

/**
 * Adds extent coordinates to the coordinates array
 * @param {Array} coordinates - The array to add coordinates to
 * @param {Array} extent - The extent array [minX, minY, maxX, maxY]
 * @returns {Array} Updated coordinates array
 */
export function addExtentCoordinates (coordinates, extent) {
    const coords = Array.isArray(coordinates) ? coordinates : [];

    coords.push([extent[0], extent[1]]);
    coords.push([extent[2], extent[1]]);
    coords.push([extent[0], extent[3]]);
    coords.push([extent[2], extent[3]]);

    return coords;
}

/**
 * Processes point results and adds unique results to allResults
 * @param {Array} pointResults - The results to process
 * @param {Array} allResults - The array to add unique results to
 */
export function processPointResults (pointResults, allResults) {
    if (pointResults && pointResults.length > 0) {
        pointResults.forEach(result => {
            if (!allResults.some(existing => JSON.stringify(existing) === JSON.stringify(result))) {
                allResults.push(result);
            }
        });
    }
}
