import Feature from "ol/Feature";

/**
 * Creates an OpenLayers Feature object prepared for a WFS-T transaction.
 * This function takes the given feature properties and geometry, and constructs
 * a Feature instance that is ready to be inserted or updated on the server.
 *
 * The resulting Feature object contains all attribute values and geometry,
 * and is intended to be used as the payload for transactional operations
 * (insert/update) against a geospatial service.
 *
 * @param {{id:string, geometryName: string, geometry: module:ol/geom/Geometry}} feature Object containing the id, geometryName and corresponding geometry of the drawn feature.
 * Id is used only if we update a feature, if we create a feature we dont need to send an Id. It will be created in backend.
 * @param {FeatureProperty[]} featureProperties Properties defined by the service with values by the user.
 * @param {Boolean} updateFeature If true, the selectedInteraction is update, otherwise it is insert.
 * @param {String} featurePrefix Prefix defined by the namespace of the service.
 * @param {Array<string>} LayerConfigAttributes Array of layer attribute names to exclude from the transaction feature.
 * @returns {module:ol/Feature} OpenLayers Feature object to be used in a WFS-T transaction.
 */
export default function createTransactionFeature (
    {id, geometry, geometryName},
    featureProperties,
    geoMarkerUpdateFeature,
    updateFeature = false,
    featurePrefix = "feature",
    LayerConfigAttributes = []) {
    const transactionFeature = new Feature(),
        featurePrefixWithoutColon = featurePrefix.replace(/:$/, "");

    featureProperties.forEach(property => {
        const key = updateFeature
            ? `${featurePrefixWithoutColon}:${property.key}`
            : property.key;

        if (property.label && !LayerConfigAttributes.includes(property.label.toLowerCase())) {
            if (updateFeature && property.label === "anhang_base_64") {
                const hasAttachment = featureProperties.some(
                    featureProperty => featureProperty.label === "anhang_name" && !["", null, undefined].includes(featureProperty.value)
                );

                if (hasAttachment) {
                    return;
                }
            }
            if (["", null, undefined].includes(property.value) && updateFeature && property.type !== "geometry") {
                transactionFeature.set(key, null);
            }
            else if (property.type === "geometry") {
                transactionFeature.setGeometryName(updateFeature
                    ? `${featurePrefixWithoutColon}:${geometryName}`
                    : geometryName);
                if (geoMarkerUpdateFeature) {
                    transactionFeature.setGeometry(geoMarkerUpdateFeature.getGeometry());
                }
                else {
                    transactionFeature.setGeometry(geometry);

                }
            }
            else if (["integer", "int", "decimal", "short", "float"].includes(property.type)) {
                if (!Number.isFinite(parseFloat(property.value))) {
                    return;
                }
                transactionFeature.set(key, Number(property.value));
            }
            else {
                transactionFeature.set(key, property.value);
            }
        }
    });

    if (id) {
        transactionFeature.setId(id);
    }

    return transactionFeature;
}
