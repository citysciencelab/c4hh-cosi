import {getCenter} from "ol/extent.js";
import {toRaw} from "vue";

/**
 * Gets a central coordinate of the given geometry, e.g. to place a marker on it.
 * For areas a point inside of the area is used, as the center of the extent may lie outside of concave areas.
 * The geometry is unwrapped from a reactive proxy of Vue, as OpenLayers fails on proxied geometries.
 * @param {module:ol/geom/Geometry} geometry - The geometry.
 * @returns {Number[]|undefined} The coordinate or undefined, if there is no geometry.
 */
function getGeometryCenter (geometry) {
    const rawGeometry = toRaw(geometry);

    if (typeof rawGeometry?.getInteriorPoint === "function") {
        return rawGeometry.getInteriorPoint().getCoordinates().slice(0, 2);
    }
    if (typeof rawGeometry?.getInteriorPoints === "function") {
        return rawGeometry.getInteriorPoints().getFirstCoordinate().slice(0, 2);
    }
    if (typeof rawGeometry?.getExtent === "function") {
        return getCenter(rawGeometry.getExtent());
    }
    return undefined;
}

export {getGeometryCenter};
