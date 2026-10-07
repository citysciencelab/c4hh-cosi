// @ts-check

/**
 * @import {StyleVariables} from "ol/style/flat"
 */

/**
 * Gets a spread, webgl-compatible variables object.
 * @param {Record<string, number[]>} outputs Object with output data.
 * @returns {StyleVariables} The style variables
 */
export default function getWebglVariables (outputs) {

    /** @type StyleVariables */
    const variables = {};

    Object.entries(outputs).forEach(([outputName, output]) => {
        if (Array.isArray(output)) {
            output.forEach((value, index) => {
                variables[`${outputName}_${index}`] = value;
            });
        }
    });

    return variables;
}
