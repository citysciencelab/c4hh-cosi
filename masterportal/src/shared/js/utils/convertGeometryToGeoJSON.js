import {GeoJSON} from "ol/format.js";
import isObject from "@shared/js/utils/isObject.js";

/**
 * Converts a geometry to a raw GeoJSON Geometry object.
 * @param {ol/geom/Geometry} geometry - The geometry to convert.
 * @param {Boolean} [asString=false] - Defines whether the feature should be returned as object or string.
 * @param {String} [sourceCrs="EPSG:25832"] - The CRS of the input.
 * @param {String} [targetCrs="EPSG:4326"] - The CRS of the output.
 * @returns {GeoJSON|String|Boolean} The converted feature as GeoJSON Feature or as string. False if the converting fails.
 */
function geometryToGeoJson (geometry, asString = false, sourceCrs = "", targetCrs = "") {
    if (!isObject(geometry)) {
        console.error("utils/convertGeometryToGeoJSON: The first parameter must be an ol geometry object, but got " + typeof geometry);
        return false;
    }
    if (typeof asString !== "boolean") {
        console.error("utils/convertGeometryToGeoJSON: The second parameter must be a boolean, but got " + typeof asString);
        return false;
    }
    if (typeof sourceCrs !== "string" || typeof targetCrs !== "string") {
        console.error("utils/convertGeometryToGeoJSON: The third and the fourth parameter must both be a string, but got " + typeof sourceCrs + " and " + typeof targetCrs);
        return false;
    }
    const parser = sourceCrs === "" || targetCrs === "" ? new GeoJSON() : new GeoJSON({
        dataProjection: targetCrs,
        featureProjection: sourceCrs
    });

    return asString ? parser.writeGeometry(geometry) : parser.writeGeometryObject(geometry);
}

export {
    geometryToGeoJson
};
