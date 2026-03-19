/**
 * Gets the highlight color based on the Vuex store configuration.
 * @param {Object} gettersColoredHighlighting3D The Vuex getter value for color.
 * @param {string} [defaultColor="RED"] The default color to use if no valid configuration is found.
 * @returns {string} The color string formatted for Cesium3DTileStyle.
 */
export default function get3DHighlightColor (gettersColoredHighlighting3D, defaultColor = "RED") {
    const highlightColor = typeof defaultColor === "string" && defaultColor.trim() !== "" ? defaultColor : "RED";
    let finalColor = `color("${highlightColor}")`;

    if (gettersColoredHighlighting3D) {
        const configuredColor = gettersColoredHighlighting3D;

        if (typeof configuredColor === "string" && isValidColor(configuredColor)) {
            finalColor = `color('${configuredColor}')`;
        }
        else if (Array.isArray(configuredColor) && configuredColor.length === 1 && typeof configuredColor[0] === "string") {
            const rgbaArray = configuredColor[0].split(",").map(val => parseFloat(val.trim()));

            if (rgbaArray.length === 4 && rgbaArray.every(num => !isNaN(num) && num >= 0 && num <= 255)) {
                const [r, g, b, a] = rgbaArray.map((val, index) => {
                    if (index === 3) {
                        return val <= 1 ? val : (val / 255).toFixed(2);
                    }
                    return val;
                });

                finalColor = `color('rgba(${r}, ${g}, ${b}, ${a})')`;
            }
            else {
                console.warn("The color format in array is not valid. Expected format: ['R, G, B, A'] with values from 0 to 255.");
            }
        }
        else {
            console.warn("The color for the 3D highlighting is not valid. Ensure it follows one of the valid color formats.");
        }
    }

    return finalColor;
}

/**
 * Validates if the given color string is in a valid format.
 * Supports color names, RGBA, RGB, HEX, and old array format.
 *
 * @param {string} color The color string to validate.
 * @returns {boolean} `true` if the color is valid, `false` otherwise.
 */
function isValidColor (color) {
    const nameColorRegex = /^[a-zA-Z]+$/,
        rgbaColorRegex = /^rgba?\(\s*(\d{1,3}\s*,\s*){3}(\d(\.\d+)?)?\s*\)$/,
        rgbColorRegex = /^rgb\(\s*(\d{1,3}\s*,\s*){2}\d{1,3}\s*\)$/,
        hexColorRegex = /^#([0-9A-Fa-f]{3}){1,2}$/;

    return nameColorRegex.test(color) || rgbaColorRegex.test(color) || rgbColorRegex.test(color) || hexColorRegex.test(color);
}

