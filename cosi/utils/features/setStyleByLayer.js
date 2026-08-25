import Feature from "ol/Feature.js";
import VectorLayer from "ol/layer/Vector.js";

/**
 * Sets the style of a feature based on the style of the given layer.
 * @param {ol/Feature} feature - The feature to set the style for.
 * @param {ol/layer/Vector} layer - The layer from which to derive the style.
 * @return {void}
 */
function setStyleByLayer (feature, layer) {
    if (typeof feature !== "object" || feature instanceof Feature === false) {
        console.error(`utils/features/setStyleByLayer: feature must be an ol feature object. Got ${feature} instead`);
        return;
    }
    if (typeof layer !== "object" || layer instanceof VectorLayer === false) {
        console.error(`utils/features/setStyleByLayer: layer must be an ol vector layer object. Got ${layer} instead`);
        return;
    }

    const styleFn = layer.getStyle && typeof layer.getStyle === "function"
        ? layer.getStyle()
        : layer.getStyle;

    if (typeof styleFn === "function") {
        feature.setStyle((resolution) => styleFn(feature, resolution));
    }
    else if (styleFn) {
        feature.setStyle(styleFn);
    }
}

export {
    setStyleByLayer
};
