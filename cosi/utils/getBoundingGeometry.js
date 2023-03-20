import {default as turfBuffer} from "@turf/buffer";
import GeoJSON from "ol/format/GeoJSON";
import GeometryCollection from "ol/geom/GeometryCollection";

const defaultCRS = {
    utm32: "EPSG:25832",
    wgs84: "EPSG:4326"
};

/**
 * @description Get the (buffered) GeometryCollection encompassing a set of features
 * @param {module:ol/Feature[]} features - The feature list
 * @param {number} [bufferValue=0] - the buffer distance in m
 * @param {string} [portalCrs="EPSG:25832"] - the CRSs of the portal and the geometry library
 * @returns {module:ol/geom/GeometryCollection} - the buffered GeometryCollection
 */
export default function getBoundingGeometry (features, bufferValue = 0, portalCrs = defaultCRS.utm32) {
    if (!(Array.isArray(features) && typeof parseFloat(bufferValue) === "number")) {
        console.error(`getBoundingGeometry: ${features} has to be defined and an array. ${bufferValue} has to be defined and a number`);
        return false;
    }
    const bufferVal = parseFloat(bufferValue),
        parser = new GeoJSON(),
        geometries = features
            .map(feature => feature
                .clone() // clone the feature as to not destruct the original layer
                .getGeometry()
                .transform(portalCrs, defaultCRS.wgs84) // transform to lat/lon
            ),
        geometryCollection = new GeometryCollection(geometries),
        geoJson = parser.writeGeometryObject(geometryCollection),
        bufferedGeoJson = turfBuffer(geoJson, bufferVal, {units: "meters"}),
        bufferedGeometries = bufferedGeoJson.features
            .map(feature => parser
                .readGeometry(feature.geometry)
                .transform(defaultCRS.wgs84, portalCrs) // retransform to portal CRS
            );

    return new GeometryCollection(bufferedGeometries);
}

