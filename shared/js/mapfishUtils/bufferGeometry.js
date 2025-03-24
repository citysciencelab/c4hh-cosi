import buffer from "@turf/buffer";
import {GeoJSON} from "ol/format";
import SimpleGeometry from "ol/geom/SimpleGeometry";

/**
 * Calculates a buffer for the passed geometry for a given radius.
 * Turf works with WGS84, therefore the geometry must be transformed.
 * @param {ol/geom/Geometry} geometry - The Geometry.
 * @param {Number} radius - The radius.
 * @param {String} [mapProjection="EPSG:25832"] - The EPSG-Code of the current map projection.
 * @returns {ol/geom/Geometry} The buffered geometry.
 */
export function bufferGeometry (geometry, radius, mapProjection = "EPSG:25832") {

    if (geometry instanceof SimpleGeometry === false) {
        console.error(`bufferGeometry: geometry is ${geometry}, but it has to be an instance of ol/geom/Geometry`);
        return null;
    }

    if (typeof radius !== "number") {
        console.error(`bufferGeometry: Type of radius is ${radius}, but it has to be a number`);
        return geometry;
    }

    if (radius === 0) {
        return geometry;
    }

    const parserGeoJson = new GeoJSON(),
        geometryClone = geometry.clone().transform(mapProjection, "EPSG:4326"),
        geojson = parserGeoJson.writeGeometryObject(geometryClone),
        bufferedFeature = buffer(geojson, radius, {units: "meters"}),
        bufferedGeometry = parserGeoJson.readGeometry(bufferedFeature.geometry);

    return bufferedGeometry.transform("EPSG:4326", mapProjection);
}
