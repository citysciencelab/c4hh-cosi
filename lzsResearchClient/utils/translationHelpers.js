/**
 * Gets the translation for an attribute name, falling back to the attribute name if translation does not exist.
 * @param {String} translationString - The translation key to look up.
 * @param {String} attributeName - The fallback value.
 * @returns {String} The translated string or the attribute name if translation does not exist.
 */
export function getTranslationForAttribute (translationString, attributeName) {
    return i18next.exists(translationString) ? i18next.t(translationString) : attributeName;
}
