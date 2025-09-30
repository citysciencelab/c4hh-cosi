import {Fill, Stroke, Style, Icon} from "ol/style.js";

/**
 * extracts the style of a feature
 * generates a new style for webgl features
 * @param {module:ol/Feature} feature - the feature to check
 * @param {function} layerStyleFunction - the style function of the layer
 * @returns {module:ol/Style} the feature style
 */
export default function getFeatureStyle (feature, layerStyleFunction) {
    // return the feature's style if exists
    if (feature.getStyle()) {
        return feature.getStyle();
    }
    // generate a style if styleFunction is set on layer
    if (layerStyleFunction) {
        return layerStyleFunction(feature);
    }
    // generate new style if styleRule is set on feature (only WebGL)
    if (feature.styleRule) {
        if (feature.styleRule.style.type === "Icon") {
            return new Style({
                image: new Icon({
                    src: (feature.styleRule.style.imagePath || Config.wfsImgPath) + feature.styleRule.style.imageName,
                    width: 40,
                    height: 40
                })
            });
        }
        return new Style({
            fill: new Fill({color: feature.styleRule.style.polygonFillColor || feature.styleRule.style.circleFillColor}),
            stroke: new Stroke({
                color: feature.styleRule.style.polygonStrokeColor || feature.styleRule.style.circleStrokeColor,
                width: feature.styleRule.style.polygonStrokeWidth || feature.styleRule.style.circleStrokeWidth
            })
        });
    }
    return null;
}
