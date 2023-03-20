import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import {Circle as CircleStyle, Fill, Stroke, Style} from "ol/style";

/**
 * Creates a vector layer and adds the given feature.
 * @param {Object} styleConfig - The style config for the layer.
 * @param {ol/Feature} feature - The feature.
 * @param {String} type - The type of the feature geometry.
 * @returns {ol/layer/Vector} The created vector layer with feature and style.
 */
function getFeatureLayer (styleConfig, feature, type) {
    const printedFeature = feature.clone();

    printedFeature.setStyle(type === "point" ? getPointStyle(styleConfig) : getPolygonStyle(styleConfig));

    return new VectorLayer({
        source: new VectorSource({
            features: [printedFeature]
        })
    });
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

export {
    getFeatureLayer,
    getPointStyle,
    getPolygonStyle
};
