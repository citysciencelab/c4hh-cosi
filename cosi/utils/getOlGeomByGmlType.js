import Polygon from "ol/geom/Polygon";
import Point from "ol/geom/Point";

/**
 * Returns the OpenLayers geometry constructor
 * @param {String} type - the gml type identifer
 * @return {module:ol/geom} the geometry type constructor
 */
export default function getOlGeomConstructorByGmlType (type) {
    if (typeof type !== "string") {
        console.error(`Type must be a string. Got ${typeof type} instead.`);
        return null;
    }
    if (!type.includes("gml:")) {
        console.warn(`Type must be part of GML namespace, e.g.: gml:PointPropertyType. Got ${type} instead.`);
        return null;
    }
    if (type.includes("Point")) {
        return Point;
    }
    if (type.includes("Polygon")) {
        return Polygon;
    }
    return null;
}

/**
 * Returns the OpenLayers geometry type as string
 * @param {String} type - the gml type identifer
 * @return {module:ol/geom} the geometry type as string
 */
export function getOlGeomTypeByGmlType (type) {
    if (typeof type !== "string") {
        console.error(`Type must be a string. Got ${typeof type} instead.`);
        return null;
    }
    if (!type.includes("gml:")) {
        console.warn(`Type must be part of GML namespace, e.g.: gml:PointPropertyType. Got ${type} instead.`);
        return null;
    }
    if (type.includes("Point")) {
        return "Point";
    }
    if (type.includes("Polygon")) {
        return "Polygon";
    }
    return null;
}
