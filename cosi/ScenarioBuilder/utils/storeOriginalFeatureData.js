/**
 * Stores a feature's original data in its properties for later use
 * @param {module:ol/Feature} feature - the feature whose data to store for later
 * @param {Boolean} [storeGeometry=true] - whether to store the geometry
 * @returns {void}
 */
export default function storeOriginalFeatureData (feature, storeGeometry = true) {
    if (!feature.get("originalData")) {
        const data = feature.getProperties();

        // make sure there is no recursive originalData key stored on the properties
        if (Object.hasOwnProperty.call(data, "originalData")) {
            delete data.originalData;
        }

        feature.set("originalData", {
            ...data
        });

        if (storeGeometry) {
            feature.get("originalData").geometry = feature.getGeometry().clone();
        }
    }

}
