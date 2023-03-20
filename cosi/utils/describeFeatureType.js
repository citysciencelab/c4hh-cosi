import {describeFeatureType, getFeatureDescription} from "../../../src/api/wfs/describeFeatureType.js";
import rawLayerList from "@masterportal/masterportalapi/src/rawLayerList";

/**
 * Gets the featureType description of a layer via its layerId. Uses WFS describeFeatureTypeRequest
 * @param {String} layerId - the layerId
 * @returns {Object[]} the featureType description as array of Objects
 */
export default async function describeFeatureTypeByLayerId (layerId) {
    const rawLayer = rawLayerList.getLayerList().find(l => l.id === layerId);

    if (rawLayer) {
        const json = await describeFeatureType(rawLayer.url),
            desc = getFeatureDescription(json, rawLayer.featureType);

        return desc;
    }

    return null;
}
