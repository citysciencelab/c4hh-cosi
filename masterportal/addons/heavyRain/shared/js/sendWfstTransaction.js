import Feature from "ol/Feature.js";
import MultiPolygon from "ol/geom/MultiPolygon.js";
import {rawLayerList} from "@masterportal/masterportalapi/src/index.js";
import wfs from "@masterportal/masterportalapi/src/layer/wfs";

/**
 * Converts the given geometry to a multi polygon, as the services only allow multi polygons.
 * @param {module:ol/geom/Geometry} geometry - The drawn geometry.
 * @returns {module:ol/geom/MultiPolygon} The geometry as a multi polygon.
 * @throws {Error} If the geometry is neither a polygon nor a multi polygon.
 */
function toMultiPolygon (geometry) {
    const type = geometry?.getType();

    if (type === "MultiPolygon") {
        return geometry;
    }

    if (type === "Polygon") {
        return new MultiPolygon([geometry.getCoordinates()]);
    }

    throw new Error(`HeavyRain: The drawn geometry is of the type ${type}, but the service only allows polygons.`);
}

/**
 * Removes a trailing colon from the feature prefix, as the transaction writer adds it itself.
 * The configuration of the layer is left untouched, as it is shared with the rest of the portal.
 * @param {Object} layerConfig - The raw configuration of the WFS-T layer.
 * @returns {Object} The configuration with a normalized feature prefix.
 */
function normalizeFeaturePrefix (layerConfig) {
    if (typeof layerConfig.featurePrefix !== "string" || !layerConfig.featurePrefix.endsWith(":")) {
        return layerConfig;
    }

    return {...layerConfig, featurePrefix: layerConfig.featurePrefix.replace(/:$/, "")};
}

/**
 * Creates the feature which is sent to the WFS-T service.
 *
 * For an insert the attributes are set without a namespace prefix, as it is required by the service.
 * Optional values which were not filled in are left out, so that the service keeps its own defaults.
 *
 * For an update the feature gets the id of the edited feature and the attributes and the geometry are prefixed with the namespace,
 * as the service only knows the prefixed property names in an update.
 * Values which were emptied are set to null, so that the service removes them.
 *
 * The properties are set in the order of the given attributes and the geometry is set last,
 * because the transaction is written in the order in which the properties were set.
 * @param {module:ol/geom/Geometry} geometry - The drawn geometry in the projection of the map.
 * @param {Object} formValues - The values of the form.
 * @param {Object} wfstAttributes - The keys are the fields of the form, the values are the attribute names of the service.
 * Has to be in the order of the schema of the service, otherwise the service rejects the properties.
 * @param {String} wfstGeometryName - Name of the geometry attribute of the service.
 * @param {Object} [update={}] - The options of an update.
 * @param {String} [update.featureId] - Id of the edited feature. If it is given, the feature is created for an update.
 * @param {String} [update.featurePrefix] - The namespace prefix of the service without a trailing colon.
 * @returns {module:ol/Feature} The feature to be sent.
 */
function createTransactionFeature (geometry, formValues, wfstAttributes, wfstGeometryName, {featureId, featurePrefix} = {}) {
    const feature = new Feature(),
        isUpdate = typeof featureId !== "undefined" && featureId !== null,
        prefix = isUpdate && featurePrefix ? `${featurePrefix}:` : "";

    Object.entries(wfstAttributes).forEach(([key, attributeName]) => {
        const value = formValues[key];

        if (value !== undefined && value !== null && value !== "") {
            feature.set(`${prefix}${attributeName}`, value);
        }
        else if (isUpdate) {
            feature.set(`${prefix}${attributeName}`, null);
        }
    });

    feature.setGeometryName(`${prefix}${wfstGeometryName}`);
    feature.setGeometry(toMultiPolygon(geometry));

    if (isUpdate) {
        feature.setId(featureId);
    }

    return feature;
}

/**
 * Sends the given values to the WFS-T service.
 * An edited feature with an id is updated, otherwise a new feature is inserted.
 * @param {Object} options - The options of the transaction.
 * @param {String} options.wfstId - Id of the WFS-T layer in the services configuration.
 * @param {String} options.projectionCode - Code of the projection of the map, e.g. "EPSG:25832".
 * @param {module:ol/geom/Geometry} options.geometry - The drawn geometry in the projection of the map.
 * @param {Object} options.formValues - The values of the form.
 * @param {Object} options.wfstAttributes - The mapping of the form fields to the attribute names of the service, see createTransactionFeature.
 * @param {String} options.wfstGeometryName - Name of the geometry attribute of the service.
 * @param {String} [options.featureId] - Id of the edited feature in the service. If it is given, the feature is updated.
 * @returns {Promise<module:ol/Feature>} Resolves with the transmitted feature.
 * @throws {Error} If the layer is not configured or the transaction fails.
 */
async function sendWfstTransaction ({wfstId, projectionCode, geometry, formValues, wfstAttributes, wfstGeometryName, featureId}) {
    const layerConfig = rawLayerList.getLayerWhere({id: wfstId});

    if (!layerConfig) {
        throw new Error(`HeavyRain: No layer with the id ${wfstId} was found in the services configuration.`);
    }

    const normalizedConfig = normalizeFeaturePrefix(layerConfig),
        isUpdate = typeof featureId !== "undefined" && featureId !== null;

    return wfs.sendTransaction(
        projectionCode,
        createTransactionFeature(geometry, formValues, wfstAttributes, wfstGeometryName, {featureId, featurePrefix: normalizedConfig.featurePrefix}),
        layerConfig.url,
        normalizedConfig,
        isUpdate ? "selectedUpdate" : "insert"
    );
}

export {createTransactionFeature, normalizeFeaturePrefix, sendWfstTransaction};
