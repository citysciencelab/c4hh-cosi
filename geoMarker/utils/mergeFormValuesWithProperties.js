/**
 * Merges form values into an array of feature property templates.
 * For each property template, if a corresponding value exists in the form values,
 * it will be assigned to the property; otherwise, the template's default value is used.
 *
 * @param {Array<Object>} preparedFeatureProperties - The array of feature property templates to populate.
 * @param {Object} newGeoMarkerFormValues - An object containing form values keyed by property name.
 * @returns {Array<Object>} The array of feature properties with values from the form or their default values.
 */
export default function mergeFormValuesWithProperties (preparedFeatureProperties, newGeoMarkerFormValues) {
    if (!preparedFeatureProperties || preparedFeatureProperties.length === 0) {
        return [];
    }

    const featurePropertiesWithFormValues = preparedFeatureProperties.map(property => {
        const value = newGeoMarkerFormValues[property.key];

        return {
            ...property,
            value: value !== undefined ? value : property.value
        };
    });

    return featurePropertiesWithFormValues;
}
