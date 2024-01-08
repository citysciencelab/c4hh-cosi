import {GeoJSON} from "ol/format";
import union from "@turf/union";

/**
 * Takes a list of features and merge them to one feature.
 * @param {ol/Feature[]} featureList - An array of features.
 * @returns {ol/Feature} The merged feature.
 */
export function unionFeatures (featureList) {
    if (!Array.isArray(featureList) || featureList.length === 0) {
        console.error(`unionFeatures: ${featureList} has to be a non empty array`);
        return null;
    }
    const parserGeoJson = new GeoJSON(),
        geojson = parserGeoJson.writeFeaturesObject(featureList);

    let unionFeature = geojson.features[0];

    for (let i = 1; i < geojson.features.length; i++) {
        unionFeature = union(unionFeature, geojson.features[i]);
    }

    return parserGeoJson.readFeature(unionFeature);
}
