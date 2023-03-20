import SimpleGeometry from "ol/geom/SimpleGeometry";
import isObject from "../../../../src/utils/isObject";

/**
 * Flat the coordinates of the given geometry in one array. If the layout of the coordinates is (XYZ) only the xy-Coordinate get back.
 * @param {ol/geom/Geometry} geometry - The geometry whose coordinates are be flat.
 * @returns {ol/coordinate[]|false} An array of coordinates([x, y]).
 */
function getFlatCoordinates (geometry) {
    if (!isObject(geometry) || !(geometry instanceof SimpleGeometry)) {
        console.error(`addons/cosi/utils/geometry/getFlatCoordinates: The first parameter must be an instance of ol/geom/Geometry, but got ${typeof geometry}`);
        return false;
    }

    if (geometry.getType() === "Polygon") {
        return geometry.getCoordinates().flat(1).map(coordinate => {
            return [coordinate[0], coordinate[1]];
        });
    }
    if (geometry.getType() === "MultiPolygon") {
        return geometry.getCoordinates().flat(2).map(coordinate => {
            return [coordinate[0], coordinate[1]];
        });
    }

    if (geometry.getType() === "Point") {
        return [[geometry.getCoordinates()[0], geometry.getCoordinates()[1]]];
    }

    console.error(`addons/cosi/utils/geometry/getFlatCoordinates: The instance of the given geometry (${geometry}) is not supported`);
    return false;
}

module.exports = {
    getFlatCoordinates
};
