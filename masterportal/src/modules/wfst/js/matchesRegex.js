/**
 * Tests a value against a regular expression configured in the layer's gfiAttributes.
 * An unusable expression (syntax error) must never block the user, so it fails open.
 * @param {String} pattern Regular expression from the layer configuration.
 * @param {*} value User input to validate.
 * @returns {Boolean} True if the value matches or the pattern cannot be compiled.
 */
export default function matchesRegex (pattern, value) {
    try {
        return new RegExp(pattern).test(String(value ?? ""));
    }
    catch (error) {
        console.warn(`WFS-T: unusable regex "${pattern}"`, error);
        return true;
    }
}
