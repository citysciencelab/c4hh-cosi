import {Fill, Stroke, Style} from "ol/style.js";

const defaultIsochroneColors = [
    "rgba(199, 214, 250, 0.55)",
    "rgba(47, 135, 245, 0.39)",
    "rgba(0, 76, 168, 0.40)"
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
                    width: 2
                }),
                zIndex: i
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
                    color: "rgba(159, 25, 215, 1)",
                    width: 4,
                    lineDash: [10, 10]
                })
            })
        );
    }
}

export {
    styleIsochroneFeatures
};
