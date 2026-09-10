/**
 * Builds normalized layer entries used for folder insertion.
 * @param {String} serviceType Service type (e.g. WMS, WFS).
 * @param {Object[]} entries Source entries from capabilities.
 * @returns {Object[]} Layer entries with name and sourceProps.
 */
export default function buildServiceLayerEntries (serviceType, entries = []) {
    if (!Array.isArray(entries) || entries.length === 0) {
        return [];
    }

    if (serviceType === "WMS") {
        return entries.map(layerEntry => ({
            name: layerEntry.title || layerEntry.name,
            sourceProps: {layers: layerEntry.name},
            queryable: layerEntry.queryable ?? true
        }));
    }

    if (serviceType === "WFS") {
        return entries.map(featureTypeEntry => {
            const sourceProps = {featureType: featureTypeEntry.name};

            if (featureTypeEntry.featureNS) {
                sourceProps.featureNS = featureTypeEntry.featureNS;
            }
            return {
                name: featureTypeEntry.title || featureTypeEntry.name,
                sourceProps
            };
        });
    }

    if (serviceType === "WMTS") {
        return entries.map(layerEntry => {
            const sourceProps = {layers: layerEntry.name};

            if (layerEntry.format) {
                sourceProps.format = layerEntry.format;
            }
            if (layerEntry.tileMatrixSet) {
                sourceProps.tileMatrixSet = layerEntry.tileMatrixSet;
            }

            return {
                name: layerEntry.title || layerEntry.name,
                sourceProps
            };
        });
    }

    if (serviceType === "OAF") {
        return entries.map(layerEntry => ({
            name: layerEntry.title || layerEntry.name,
            sourceProps: {collection: layerEntry.name}
        }));
    }

    return entries;
}
