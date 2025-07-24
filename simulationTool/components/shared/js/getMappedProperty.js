import isObject from "../../../../../src/shared/js/utils/isObject.js";

/**
 * Gets the mapped property from key and configured object.
 * @param {String} key - The property from feature.
 * @param {Object} propertiesMapping - The mapped properties object.
 * @returns {String} The mapped property.
 */
export function getMappedProperty (key, propertiesMapping) {
    if (typeof key !== "string") {
        return "";
    }
    if (!isObject(propertiesMapping)) {
        return key;
    }

    return typeof propertiesMapping[key] !== "undefined" ? i18next.t(propertiesMapping[key]) : key;
}
