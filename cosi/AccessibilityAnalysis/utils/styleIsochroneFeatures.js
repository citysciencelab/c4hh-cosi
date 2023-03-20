import {Fill, Stroke, Style} from "ol/style.js";

const defaultIsochroneColors = [
    "rgba(240, 0, 3, 0.2)",
    "rgba(200, 200, 3, 0.2)",
    "rgba(0, 240, 3, 0.2)"
];

/**
 * Style the isochrone features.
 * @param {ol/Feature[]} features - The isochone features (polygons).
 * @param {String[]} [colors] - The colors for the features style.
 * @returns {void}
 */
function styleIsochroneFeatures (features, colors = defaultIsochroneColors) {
    if (!Array.isArray(features) || features.length !== 3 && features.length !== 4) {
        console.error("AccessibilityAnalysis/utils/styleIsochroneFeatures: The first parameter must be a non empty array, but got " + typeof features);
        return;
    }
    if (!Array.isArray(colors)) {
        console.error("AccessibilityAnalysis/utils/styleIsochroneFeatures: The second parameter must be an array, but got " + typeof colors);
        return;
    }
    const startIndex = features.length === 3 ? 0 : 1;

    for (let i = startIndex; i < features.length; i++) {
        features[i].setStyle(
            new Style({
                fill: new Fill({
                    color: colors[i - startIndex]
                }),
                stroke: new Stroke({
                    color: "white",
                    width: 1
                })
            })
        );
    }

    // reference isochrone feature for traffic flow index = 1
    if (startIndex === 1) {
        features[0].setStyle(
            new Style({
                fill: new Fill({
                    color: "rgba(255, 255, 255, 0)"
                }),
                stroke: new Stroke({
                    color: "rgba(100, 80, 80, 1)",
                    width: 2,
                    lineDash: [10, 8]
                })
            })
        );
    }
}

module.exports = {
    styleIsochroneFeatures
};
