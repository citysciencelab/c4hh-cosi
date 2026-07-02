/**
 * Gets the translation for an attribute name, falling back to the attribute name if translation does not exist.
 * @param {String} translationString - The translation key to look up.
 * @param {String} attributeName - The fallback value.
 * @returns {String} The translated string or the attribute name if translation does not exist.
 */
function getTranslationForAttribute (translationString, attributeName) {
    return i18next.exists(translationString) ? i18next.t(translationString) : attributeName;
}

/**
 * Takes the string, splits it into words and makes each word lowercase with its first letter uppercase.
 * @param {String} stringToConvert - The string to be converted.
 * @returns {String} The converted string.
 */
function capitalizeString (stringToConvert) {
    if (typeof stringToConvert !== "string" || stringToConvert.length === 0) {
        return stringToConvert;
    }

    return stringToConvert
        .split(" ")
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(" ");
}

export {
    getTranslationForAttribute,
    capitalizeString
};
