import ConvertStyle from "./convertStyle.js";
import {GeoJSON} from "ol/format.js";

const geoJsonParser = new GeoJSON();

/**
 * Converts OpenLayers features to GeoJSON features.
 * @param {ol/Feature[]} features - Openlayers features.
 * @returns {GeoJSON} OpenLayers features.
 */
function openlayersToGeoJson (features) {
    const geoJsonFeatures = [];

    features.forEach(feature => {
        const geojsonFeature = geoJsonParser.writeFeatureObject(feature);

        geojsonFeature.style = ConvertStyle.openlayersToGeoJson(feature.getStyle());
        geoJsonFeatures.push(geojsonFeature);
    });

    return geoJsonFeatures;
}


/**
 * Converts GeoJSON Features to Openlayers features.
 * @param {GeoJSON} features - GeoJSON features.
 * @returns {ol/Feature[]} The openlayers features.
 */
function geoJsonToOpenlayers (features) {
    const olFeatures = [];

    features.forEach(feature => {
        const olFeature = geoJsonParser.readFeature(feature);

        if (feature.style) {
            olFeature.setStyle(ConvertStyle.geoJsonToOpenlayers(feature.style));
        }
        else {
            olFeature.setStyle(null);
        }

        olFeatures.push(olFeature);
    });
    return olFeatures;
}

export default {
    geoJsonToOpenlayers,
    openlayersToGeoJson
};
