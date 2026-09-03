/**
 * Returns the first matching property from nameProperties on a feature.
 * @param {module:ol/Feature} feature - The feature to inspect.
 * @param {String[]} nameProperties - Array of property names to check for.
 * @returns {{key: String, value: *}|null} The matching property key and value, or null if none exists.
 */
function getNameProperty (feature, nameProperties) {
    if (!feature?.getProperties) {
        return null;
    }

    const normalizedNameProperties = nameProperties.map(name => String(name).toLowerCase()),
        properties = feature.getProperties();

    for (const [key, value] of Object.entries(properties)) {
        if (normalizedNameProperties.includes(String(key).toLowerCase()) && value !== undefined && value !== null && value !== "") {
            return {key, value};
        }
    }

    return null;
}

export {
    getNameProperty
};
