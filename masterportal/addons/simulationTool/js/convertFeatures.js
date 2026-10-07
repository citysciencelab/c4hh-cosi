import Circle from "ol/geom/Circle.js";
import ConvertStyle from "./convertStyle.js";
import {fromCircle} from "ol/geom/Polygon";
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
        if (feature?.getGeometry() instanceof Circle) {
            feature.setGeometry(fromCircle(feature.getGeometry(), 64));
        }

        const geojsonFeature = geoJsonParser.writeFeatureObject(feature);

        geojsonFeature.style = ConvertStyle.openlayersToGeoJson(feature.getStyle());
        geoJsonFeatures.push(geojsonFeature);
    });

    return geoJsonFeatures;
}


/**
 * Converts GeoJSON Features to Openlayers features.
 * @param {GeoJSON} features - GeoJSON features.
 * @param {Object} properties - Properties to set on each OpenLayers feature.
 * @returns {ol/Feature[]} The openlayers features.
 */
function geoJsonToOpenlayers (features, properties = {}) {
    const olFeatures = [];

    features.forEach(feature => {
        const olFeature = geoJsonParser.readFeature(feature);

        if (feature.style) {
            olFeature.setStyle(ConvertStyle.geoJsonToOpenlayers(feature.style));
        }
        else {
            olFeature.setStyle(null);
        }
        olFeature.setProperties(properties);

        olFeatures.push(olFeature);
    });
    return olFeatures;
}

export default {
    geoJsonToOpenlayers,
    openlayersToGeoJson
};
