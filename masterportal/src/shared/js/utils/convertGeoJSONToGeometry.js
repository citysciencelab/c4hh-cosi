import {GeoJSON} from "ol/format.js";
import isObject from "@shared/js/utils/isObject.js";

/**
 * Convert a single GeoJSON object to a openlayers geometry.
 * @param {GeoJSON} geoJson - The GeoJSON to convert.
 * @param {String} [sourceCrs="EPSG:4326"] - The CRS of the input.
 * @param {String} [targetCrs="EPSG:25832"] - The CRS of the output.
 * @returns {ol/Geometry|Boolean} The converted geometry. False if the converting fails.
 */
function geoJsonToGeometry (geoJson, sourceCrs = "", targetCrs = "") {
    if (!isObject(geoJson)) {
        console.error("utils/convertGeoJSONToGeometry: The first parameter must be an object, but got " + typeof geoJson);
        return false;
    }

    if (typeof sourceCrs !== "string" || typeof targetCrs !== "string") {
        console.error("utils/convertGeoJSONToGeometry: The second and the third parameter must both be a string, but got " + typeof sourceCrs + " and " + typeof targetCrs);
        return false;
    }
    const parser = sourceCrs === "" || targetCrs === "" ? new GeoJSON() : new GeoJSON({
        dataProjection: targetCrs,
        featureProjection: sourceCrs
    });

    return parser.readGeometry(geoJson);
}

export {
    geoJsonToGeometry
};
