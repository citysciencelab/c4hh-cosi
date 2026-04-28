import {GeoJSON} from "ol/format";
import isObject from "../../../../src/shared/js/utils/isObject";

/**
 * Convert a single GeoJSON feature to a openlayers feature.
 * @param {GeoJSON} geoJson - The GeoJSON to convert.
 * @param {String} [sourceCrs="EPSG:4326"] - The CRS of the input.
 * @param {String} [targetCrs="EPSG:25832"] - The CRS of the output.
 * @returns {ol/Feature|Boolean} The converted feature. False if the converting fails.
 */
function geoJsonToFeature (geoJson, sourceCrs = "EPSG:4326", targetCrs = "EPSG:25832") {
    if (!isObject(geoJson)) {
        console.error("utils/features/convertFromGeoJson: The first parameter must be an ol feature object, but got " + typeof geoJson);
        return false;
    }

    if (typeof sourceCrs !== "string" || typeof targetCrs !== "string") {
        console.error("utils/features/convertFromGeoJson: The third and the fourth parameter must both be a string, but got " + typeof sourceCrs + " and " + typeof targetCrs);
        return false;
    }
    const parser = new GeoJSON({
        dataProjection: sourceCrs,
        featureProjection: targetCrs
    });

    return parser.readFeature(geoJson);
}

/**
 * Convert a GeoJSON feature collection to openlayers features.
 * @param {GeoJSON} geoJson - The GeoJSON to convert.
 * @param {String} [sourceCrs="EPSG:4326"] - The CRS of the input.
 * @param {String} [targetCrs="EPSG:25832"] - The CRS of the output.
 * @returns {ol/Feature[]|Boolean} The converted features. False if the converting fails.
 */
function geoJsonCollectionToFeatures (geoJson, sourceCrs = "EPSG:4326", targetCrs = "EPSG:25832") {
    if (!isObject(geoJson)) {
        console.error("utils/features/convertFromGeoJson: The first parameter must be an ol feature object, but got " + typeof geoJson);
        return false;
    }

    if (typeof sourceCrs !== "string" || typeof targetCrs !== "string") {
        console.error("utils/features/convertFromGeoJson: The third and the fourth parameter must both be a string, but got " + typeof sourceCrs + " and " + typeof targetCrs);
        return false;
    }
    const parser = new GeoJSON({
        dataProjection: sourceCrs,
        featureProjection: targetCrs
    });

    return parser.readFeatures(geoJson);
}

export {
    geoJsonToFeature,
    geoJsonCollectionToFeatures
};
