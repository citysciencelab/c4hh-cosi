import {getLayerSource} from "../../utils/layer/getLayerSource";
import deepEqual from "deep-equal";

/**
 * gets an existing feature by matching the geometry
 * @param {module:ol/source/Vector} source - the source to search
 * @param {module:ol/Geom} geom - the geom to match
 * @returns {module:ol/Feature} matched feature
 */
function getFeatureByGeom (source, geom) {
    return source.getFeatures()
        .find(f => deepEqual(f.getGeometry().getCoordinates(), geom.getCoordinates()));
}

/**
 * looks up the original of a feature and replaces it with the one in the scenario
 * @param {*} feature - the ol feature from the scenario
 * @param {*} layer - the layer to replace the feature on
 * @returns {void}
 */
export default async function checkAndReplaceOriginalFeature (feature, layer) {
    const
        source = getLayerSource(layer),
        originalFeature = source.getFeatureById(feature.getId()) || getFeatureByGeom(source, feature.get("originalData").geometry);

    if (originalFeature && feature !== originalFeature) {
        source.removeFeature(originalFeature);
        source.addFeature(feature);
    }
}
