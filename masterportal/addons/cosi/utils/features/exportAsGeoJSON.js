import {featureToGeoJson} from "../../utils/features/convertToGeoJson";
import {downloadJsonToFile} from "../../utils/download";

/**
 * Exports the given feature as a GeoJSON file.
 * @param {ol/Feature} feature - The feature to be exported.
 * @returns {void}
 */
export function exportFeatureAsGeoJSON (feature, filename) {
    if (typeof filename !== "string") {
        console.error("utils/features/exportAsGeoJSON: The second parameter must be a string, but got " + typeof filename);
    }

    const geoJsonFeature = featureToGeoJson(feature);

    downloadJsonToFile(geoJsonFeature, filename + ".geojson");
}
