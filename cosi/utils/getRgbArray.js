/**
 * gets a color represented as a short array [red, green, blue, alpha]
 * @param {string} color - rgb string
 * @param {number} alpha - alpha value
 * @returns {array} an array of rgb(a) values
 */
export default function getRgbArray (color, alpha) {
    let rgb = [];

    rgb = color.match(/([0-9]+\.?[0-9]*)/g);

    // Ensure all values in rgb are decimal numbers, not strings.
    for (let i = 0; i < rgb.length; i++) {
        rgb[i] = parseInt(rgb[i], 10);
    }

    if (alpha) {
        rgb.push(alpha);
    }

    return rgb;
}
