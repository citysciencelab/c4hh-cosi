// @ts-check

import {Fill, Stroke} from "ol/style";
import Style from "ol/style/Style";

/**
 * @import {InlineOrRefData, Results} from "../types/ogcApi.processes"
 * @import {Color} from "ol/color"
 * @import {ColorLike} from "ol/colorlike"
 * @import {StyleFunction} from "ol/style/Style"
 */

/**
 * @typedef {Color | ColorLike} OlColor
 */

/**
 * @typedef DisplayOptions
 * @property {string} type - Must be "dynamic-binary" for this function to return a style.
 * @property {[string, string]} properties - The properties of the feature to consider for styling.
 * @property {Record<string, string>} classificationBreakOutputs - A mapping of classification breaks to output values.
 * @property {OlColor[][]} colors - A matrix of colors for styling features based on classification breaks.
 * @property {OlColor} strokeColor - The color of the feature's stroke.
 * @property {number} strokeWidth - The width of the feature's stroke.
 */
/**
 * Returns a style function based on the provided display options and job results.
 * @param {DisplayOptions} displayOptions - The display options for the feature.
 * @param {Results} jobResults - The job results containing feature data.
 * @returns {StyleFunction|undefined} A style function for the feature or null if no style is applicable.
 */
export default function getStyleFunctionFromDisplayOptions (displayOptions, jobResults) {
    if (displayOptions.type !== "dynamic-binary") {
        console.warn("getStyleFunctionFromDisplayOptions supports only dynamic-binary");
        return undefined;
    }

    const firstClassificationOutputKey = displayOptions.classificationBreakOutputs[displayOptions.properties[0]];
    const secondClassificationOutputKey = displayOptions.classificationBreakOutputs[displayOptions.properties[1]];

    const firstClassificationOutput = jobResults[firstClassificationOutputKey];
    const secondClassificationOutput = jobResults[secondClassificationOutputKey];

    const firstClassificationBreaks = getNumericArrayFromOutput(firstClassificationOutput);
    const secondClassificationBreaks = getNumericArrayFromOutput(secondClassificationOutput);

    if (!firstClassificationBreaks || !secondClassificationBreaks) {
        console.warn("Could not create style function from classification breaks");
        return undefined;
    }

    /** @type Style[][] */
    const cashedStyles = [];

    return (feature) => {
        const firstValue = feature.get(displayOptions.properties[0]);
        const secondValue = feature.get(displayOptions.properties[1]);

        if (typeof firstValue !== "number" || typeof secondValue !== "number") {
            console.warn("No numeric values in feature");
            return undefined;
        }

        const firstIndex = getClassificationIndex(firstClassificationBreaks, firstValue);
        const secondIndex = getClassificationIndex(secondClassificationBreaks, secondValue);

        if (cashedStyles[firstIndex]?.[secondIndex]) {
            return cashedStyles[firstIndex][secondIndex];
        }

        const color = displayOptions.colors[firstIndex][secondIndex];
        const style = new Style({
            fill: new Fill({color}),
            stroke: new Stroke({
                color: displayOptions.strokeColor,
                width: displayOptions.strokeWidth
            })
        });

        cashedStyles[firstIndex] ??= [];
        cashedStyles[firstIndex][secondIndex] = style;

        return style;
    };
}

/**
 * @param {InlineOrRefData} output The output.
 * @returns {number[] | undefined} The Array of numbers or undefined.
 */
function getNumericArrayFromOutput (output) {
    if (typeof output !== "object"
        || Array.isArray(output)
        || !("value" in output)
        || !Array.isArray(output.value)
    ) {
        return undefined;
    }
    return output.value.map(Number);
}

/**
 * Gets the index for the class a value falls in.
 * @param {number[]} classificationBreaks The classification breaks.
 * @param {number} value The value to get the index for.
 */
function getClassificationIndex (classificationBreaks, value) {
    let index = 0;

    for (const threshold of classificationBreaks) {
        if (value < threshold) {
            break;
        }
        index++;
    }
    return index;
}
