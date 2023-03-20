import {Stroke, Fill, Style, Text} from "ol/style.js";
import Feature from "ol/Feature";
import VectorLayer from "ol/layer/Vector";

/**
 * Style function for the guide layer
 * @param {module:ol/Feature} feature - the simulated feature
 * @returns {Function} the style function
 */
export function featureTagStyle (feature) {
    return new Style({
        text: new Text({
            font: "32px bold sans-serif",
            fill: new Fill({
                color: "#FC176B"
            }),
            stroke: new Stroke({
                width: 4,
                color: "#000"
            }),
            text: "*",
            offsetX: 10,
            offsetY: -5,
            placement: feature.getGeometry()?.getType() === "Point" ? "point" : "line"
        })
    });
}

/**
 * Style for modified features for the guide layer.
 * @param {module:ol/Feature} feature - The modified feature.
 * @returns {module:ol/Style} The style.
 */
export function featureTagStyleMod (feature) {
    return new Style({
        text: new Text({
            font: "22px sans-serif",
            fill: new Fill({
                color: "#FC176B"
            }),
            stroke: new Stroke({
                width: 1,
                color: "#000"
            }),
            text: "⇄",
            offsetX: 15,
            offsetY: -12,
            placement: feature.getGeometry()?.getType() === "Point" ? "point" : "line"
        })
    });
}

/**
 * adds a new feature to the guidelayer to highlight simulated features
 * @param {module:ol/Feature} feature - the original scenario feature
 * @param {module:ol/Layer/Vector} layer - the drawing layer of the scenario builder
 * @param {module:ol/Layer/Vector} featureLayer - the layer the original feature belongs to
 * @returns {module:ol/Feature | null} the feature of the tag
 */
export function addSimulationTag (feature, layer, featureLayer) {
    if (!(feature.constructor === Feature && layer.constructor === VectorLayer && featureLayer.constructor === VectorLayer)) {
        console.warn(`addSimulationTag: FeatureLayer must be of type "ol/Layer/Vector", got ${featureLayer.constructor}. Layer must be of type "ol/Layer/Vector", got ${layer.constructor}. Feature must be of type "ol/Feature, got ${feature.constructor}`);
        return null;
    }
    const source = layer.getSource(),
        clonedFeature = feature.clone();

    // give the simulation tag the identical ID as the referenced feature for retrieval
    clonedFeature.setId(feature.getId());
    // link their geometries (works only if the original layer is NOT clustered)
    clonedFeature.setGeometry(feature.getGeometry());
    // link the original layer for later use
    clonedFeature.set("featureLayer", featureLayer);
    // remove feature's style if exists (automatically replace with layer style)
    clonedFeature.setStyle(null);

    source.addFeature(clonedFeature);

    return clonedFeature;
}

/**
 * removes a feature from the guidelayer by the original feature's ID
 * @param {module:ol/Feature} feature - the original scenario feature
 * @param {module:ol/Layer/Vector} layer - the drawing layer of the scenario builder
 * @returns {void}
 */
export function removeSimulationTag (feature, layer) {
    if (!(feature.constructor === Feature && layer.constructor === VectorLayer)) {
        console.warn(`removeSimulationTag: Layer must be of type "ol/Layer/Vector", got ${layer.constructor}. Feature must be of type "ol/Feature, got ${feature.constructor}`);
        return;
    }
    const source = layer.getSource(),
        clonedFeature = source.getFeatureById(feature?.getId());

    if (clonedFeature) {
        source.removeFeature(clonedFeature);
    }
}

/**
 * Clears all features from the guide layer
 * @param {module:ol/Layer/Vector} layer - the guidelayer
 * @returns {void}
 */
export function clearGuideLayer (layer) {
    if (!layer.constructor === VectorLayer) {
        console.warn(`removeSimulationTag: Layer must be of type "ol/Layer/Vector", got ${layer.constructor}.`);
        return;
    }
    layer.getSource().clear();
}

/**
 * Shows or hides tags according to layer visibility
 * @todo refactor
 * @param {*} guideLayer - the guide layer hosting the tags
 * @param {*} activeLayers - the active vector layer list of the map
 * @returns {void}
 */
export function toggleTagsOnLayerVisibility (guideLayer, activeLayers) {
    const tags = guideLayer.getSource().getFeatures(),
        unsetStyle = new Style();

    for (const tag of tags) {
        if (activeLayers.includes(tag.get("featureLayer"))) {
            tag.setStyle();
        }
        else {
            tag.setStyle(unsetStyle);
        }
    }
}
