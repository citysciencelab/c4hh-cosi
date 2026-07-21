import wfs from "@masterportal/masterportalapi/src/layer/wfs.js";

/**
 * Prepares the possible feature properties to be set for
 * a DescribeFeatureType request and joins this together
 * with the gfiAttributes configuration of the layer.
 *
 * @param {TransactionLayer} layer Layer to retrieve information for.
 * @returns {FeatureProperty[]} If layer.gfiAttributes !== "ignore", then an array of prepared feature properties; else and empty array.
 */
async function prepareFeatureProperties (layer, featurePropertiesValues) {
    const isGfiAttributesIgnore = layer.gfiAttributes === "ignore";
    const isGfiAttributesShowAll = layer.gfiAttributes === "showAll";
    const url = layer.url;
    let properties;
    let propertiesWithBooleans = [];
    let preparedProperties = [];

    if (isGfiAttributesIgnore) {
        return [];
    }

    try {
        properties = await wfs.receivePossibleProperties(url, layer.version, layer.featureType, layer.isSecured);
    }
    catch (e) {
        console.error(e);
    }

    if (!properties) {
        return [];
    }

    propertiesWithBooleans = properties.map(property => property.type === "boolean" && property.value === null ? {...property, valid: true, value: false} : property);

    if (isGfiAttributesShowAll) {
        preparedProperties = propertiesWithBooleans;
    }
    else {
        const layerGfiAttributesKeys = Object.keys(layer.gfiAttributes);

        preparedProperties = propertiesWithBooleans
            .reduce((array, property) => {
                if (property.type === "geometry") {
                    return [...array, property];
                }

                if (!layerGfiAttributesKeys.includes(property.key)) {
                    return array;
                }

                const gfiAttributeEntry = layer.gfiAttributes[property.key];
                const label = getLabelForProperty(property, gfiAttributeEntry);

                return [...array, {
                    ...property,
                    label,
                    regex: gfiAttributeEntry?.regex,
                    regexError: gfiAttributeEntry?.regexError
                }];
            },
            []);
    }

    if (Array.isArray(featurePropertiesValues)) {
        preparedProperties.forEach((preparedProperty) => {
            featurePropertiesValues.forEach((featurePropertiesValue) => {
                if (featurePropertiesValue.key === preparedProperty.key) {
                    preparedProperty.value = featurePropertiesValue.value;
                }
            });
        });
    }

    return preparedProperties;
}

/**
 * Extracts the label for a property from the gfiAttributes configuration of the layer.
 *
 * @param {FeatureProperty} property the property to extract the label for.
 * @param {string|object} gfiAttributeEntry the gfiAttributes entry for the property.
 * @returns {string} The resolved label for the property.
 */
function getLabelForProperty (property, gfiAttributeEntry) {
    if (typeof gfiAttributeEntry === "string") {
        return gfiAttributeEntry;
    }
    if (typeof gfiAttributeEntry === "object" && !Array.isArray(gfiAttributeEntry)) {
        return typeof gfiAttributeEntry?.name === "string"
            ? gfiAttributeEntry.name
            : property.label;
    }
    return property.label;
}

export default {prepareFeatureProperties};
