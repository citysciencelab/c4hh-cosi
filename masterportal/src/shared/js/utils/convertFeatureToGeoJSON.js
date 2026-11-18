import Feature from "ol/Feature.js";
import {GeoJSON} from "ol/format.js";
import isObject from "@shared/js/utils/isObject.js";

/**
 * Converts a feature to a raw GeoJSON Feature object or string.
 * @param {ol/Feature} feature - The feature to convert.
 * @param {Boolean} [asString=false] - Defines whether the feature should be returned as object or string.
 * @param {String} [sourceCrs="EPSG:25832"] - The CRS of the input.
 * @param {String} [targetCrs="EPSG:4326"] - The CRS of the output.
 * @returns {GeoJSON|String|Boolean} The converted feature as GeoJSON Feature or as string. False if the converting fails.
 */
function featureToGeoJson (feature, asString = false, sourceCrs = "", targetCrs = "") {
    if (!isObject(feature) || !(feature instanceof Feature)) {
        console.error("utils/convertFeatureToGeoJSON: The first parameter must be an ol feature object, but got " + typeof feature);
        return false;
    }
    if (typeof asString !== "boolean") {
        console.error("utils/convertFeatureToGeoJSON: The second parameter must be a boolean, but got " + typeof asString);
        return false;
    }
    if (typeof sourceCrs !== "string" || typeof targetCrs !== "string") {
        console.error("utils/convertFeatureToGeoJSON: The third and the fourth parameter must both be a string, but got " + typeof sourceCrs + " and " + typeof targetCrs);
        return false;
    }
    const parser = sourceCrs === "" || targetCrs === "" ? new GeoJSON() : new GeoJSON({
        dataProjection: targetCrs,
        featureProjection: sourceCrs
    });

    return asString ? parser.writeFeature(feature) : parser.writeFeatureObject(feature);
}

/**
 * Converts a list of features to a raw GeoJSON FeatureCollection object or string.
 * @param {ol/Feature[]} features - The features to convert.
 * @param {Boolean} [asString=false] - Defines whether the feature should be returned as object or string.
 * @param {String} [sourceCrs="EPSG:25832"] - The CRS of the input.
 * @param {String} [targetCrs="EPSG:4326"] - The CRS of the output.
 * @returns {GeoJSON|String|Boolean} The converted features as GeoJSON FeatureCollection or as string. False if the converting fails.
 */
function featuresToGeoJsonCollection (features, asString = false, sourceCrs = "", targetCrs = "") {
    if (!Array.isArray(features)) {
        console.error("utils/convertFeatureToGeoJSON: The first parameter must be an array, but got " + typeof features);
        return false;
    }
    if (typeof asString !== "boolean") {
        console.error("utils/convertFeatureToGeoJSON: The second parameter must be a boolean, but got " + typeof asString);
        return false;
    }
    if (typeof sourceCrs !== "string" || typeof targetCrs !== "string") {
        console.error("utils/convertFeatureToGeoJSON: The third and the fourth parameter must both be a string, but got " + typeof sourceCrs + " and " + typeof targetCrs);
        return false;
    }

    const parser = sourceCrs === "" || targetCrs === "" ? new GeoJSON() : new GeoJSON({
        dataProjection: targetCrs,
        featureProjection: sourceCrs
    });

    return asString ? parser.writeFeatures(features) : parser.writeFeaturesObject(features);
}

export {
    featureToGeoJson,
    featuresToGeoJsonCollection
};
