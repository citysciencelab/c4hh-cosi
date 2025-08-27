/**
 * Utility function for translation handling in the Combined GFI addon
 */

/**
 * Translates a key if it looks like a translation key, otherwise returns the original value.
 * A translation key is identified by containing a colon (:) and being a valid i18next key.
 *
 * @param {String} key - The key to potentially translate.
 * @returns {String} The translated value or the original key if not a translation key.
 */
export function translateKeyIfPossible (key) {
    if (typeof key !== "string" || !key.includes(":")) {
        return key;
    }

    try {
        const translation = i18next.t(key);

        if (translation === key || typeof translation === "undefined") {
            return key.split(":", 2)[1];
        }

        return translation;
    }
    catch (error) {
        return key;
    }
}
