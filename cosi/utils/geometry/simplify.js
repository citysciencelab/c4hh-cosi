import {default as turfSimplify} from "@turf/simplify";
import {polygon, multiPolygon} from "@turf/helpers";
import GeoJSON from "ol/format/GeoJSON";
import SimpleGeometry from "ol/geom/SimpleGeometry";
import isObject from "../../../../src/utils/isObject";

/**
 * Takes a geometry and returns a simplified version.
 * @param {ol/geom/Geometry} geometry - Geometry to be simplified.
 * @param {Number} tolerance - The simplification tolerance.
 * @returns {ol/geom/Geometry|false} The simplified Geometry or false if something fails.
 * @see {@link https://turfjs.org/docs/#simplify}
 */
function simplify (geometry, tolerance = 1) {
    if (!isObject(geometry) || !(geometry instanceof SimpleGeometry)) {
        console.error(`addons/cosi/utils/geometry/simplify: The first parameter must be an instance of ol/geom/Geometry, but got ${typeof geometry}`);
        return false;
    }

    if (typeof tolerance !== "number") {
        console.error(`addons/cosi/utils/geometry/simplify: The second parameter must be a number, but got ${typeof tolerance}`);
        return false;
    }

    if (geometry.getType() === "Point") {
        return geometry;
    }

    let geojson;

    if (geometry.getType() === "Polygon") {
        geojson = polygon(geometry.getCoordinates());
    }
    else if (geometry.getType() === "MultiPolygon") {
        geojson = multiPolygon(geometry.getCoordinates());
    }
    else {
        console.error(`addons/cosi/utils/geometry/simplify: The instance of the given geometry (${geometry}) is not supported`);
        return false;
    }

    const parser = new GeoJSON(),
        simplifiedFeature = turfSimplify(geojson, {tolerance}),
        simplifiedGeometry = parser.readGeometry(simplifiedFeature.geometry);

    return simplifiedGeometry;
}

module.exports = {
    simplify
};
