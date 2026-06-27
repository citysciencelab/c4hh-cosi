import VectorLayer from "ol/layer/Vector.js";
import VectorSource from "ol/source/Vector.js";
import {Circle as CircleStyle, Fill, Stroke, Style} from "ol/style.js";

/**
 * Creates a vector layer and adds the given feature.
 * @param {Object} styleConfig - The style config for the layer.
 * @param {ol/Feature} feature - The feature.
 * @param {String} type - The type of the feature geometry.
 * @returns {ol/layer/Vector} The created vector layer with feature and style.
 */
async function getFeatureLayer (styleConfig, feature, type) {
    const printedFeature = await feature.clone(),
        vectorSource = new VectorSource(),
        vectorLayer = new VectorLayer();

    await printedFeature.setStyle(type === "point" ? getPointStyle(styleConfig) : getPolygonStyle(styleConfig));
    vectorLayer.setSource(vectorSource);
    vectorSource.addFeature(printedFeature);

    return vectorLayer;
}

/**
 * Gets a style for a point feature.
 * @param {Object} styleConfig - The config for the style.
 * @returns {ol/Style} The feature style.
 */
function getPointStyle (styleConfig) {
    const pointSize = styleConfig?.pointSize ? styleConfig.pointSize : 4,
        color = styleConfig?.color ? styleConfig.color : [228, 26, 28, 1];

    return new Style({
        image: new CircleStyle({
            radius: pointSize,
            stroke: new Stroke({
                color: color,
                width: 1
            }),
            fill: new Fill({
                color: color
            })
        })
    });
}

/**
 * Gets a style for a multipolygon feature.
 * @param {Object} styleConfig - The config for the style.
 * @returns {ol/Style} The feature style.
 */
function getPolygonStyle (styleConfig) {
    const borderSize = styleConfig?.borderSize ? styleConfig.borderSize : 4,
        color = styleConfig?.color ? styleConfig.color : [255, 255, 255, 1];

    return new Style({
        stroke: new Stroke({
            color: color,
            width: borderSize
        }),
        fill: new Fill({
            color: [255, 255, 255, 0]
        })
    });
}

export default {
    getFeatureLayer,
    getPointStyle,
    getPolygonStyle
};
