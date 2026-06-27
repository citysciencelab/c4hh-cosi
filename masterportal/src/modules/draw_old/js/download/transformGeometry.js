import proj4 from "proj4";

/**
 * Transforms the given line or polygon coordinates from a given source projection to EPSG:4326.
 * @param {String} sourceProjectionCode source projection.
 * @param {(Array<number>|Array<Array<number>>|Array<Array<Array<number>>>)} coords Coordinates.
 * @param {Boolean} isPolygon Determines whether the given coordinates are a polygon or a line.
 * @returns {(Array<number>|Array<Array<number>>|Array<Array<Array<number>>>)} Transformed coordinates.
 */
function transform (sourceProjectionCode, coords, isPolygon) {
    const transCoords = [];

    for (const value of coords) {
        if (isPolygon) {
            if (coords.length > 1) {
                transCoords.push(transform(sourceProjectionCode, value, isPolygon)[0]);
            }
            else {
                value.forEach(point => {
                    if (point.length > 2) {
                        transCoords.push(transform(sourceProjectionCode, point, isPolygon));
                    }
                    else {
                        transCoords.push(transformPoint(sourceProjectionCode, point));
                    }
                });
                continue;
            }
        }
        else if (value.length > 2 && !isPolygon) {
            transCoords.push(transform(sourceProjectionCode, value, isPolygon));
        }
        else {
            transCoords.push(transformPoint(sourceProjectionCode, value));
        }
    }
    return isPolygon ? [transCoords] : transCoords;
}
/**
 * requests the transformPoint function for each individual point
 * @param {String} sourceProjectionCode source projection.
 * @param {Number[]} coords Coordinates.
 * @returns {Number[]} Transformed coordinates.
 */
function transformMultiPoint (sourceProjectionCode, coords) {
    const multiPoint = [];

    coords.forEach(point =>{
        multiPoint.push(transformPoint(sourceProjectionCode, point));
    });
    return multiPoint;
}
/**
 * Transforms the given point coordinates from a given source projection to EPSG:4326.
 * @param {String} sourceProjectionCode source projection.
 * @param {Number[]} coords Coordinates.
 * @returns {Number[]} Transformed coordinates.
 */
function transformPoint (sourceProjectionCode, coords) {
    return proj4(proj4(sourceProjectionCode), proj4("EPSG:4326"), coords);
}
/**
 * Transforms the given geometry from a given source projection to EPSG:4326.
 * @param {String} sourceProjectionCode source projection.
 * @param {Geometry} geometry Geometry.
 * @returns {Geometry} The given geometry.
 */
function transformGeometry (sourceProjectionCode, geometry) {
    return geometry.transform(sourceProjectionCode, "EPSG:4326");
}

export {
    transform,
    transformMultiPoint,
    transformPoint,
    transformGeometry
};
