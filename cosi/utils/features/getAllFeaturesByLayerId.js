import {WFS} from "ol/format.js";
import rawLayerList from "@masterportal/masterportalapi/src/rawLayerList";
import {getFeatureGET} from "../../../../src/api/wfs/getFeature";

/**
 * Returns all features of a layer by the given layer id.
 * @param {String} layerId - The id of the layer.
 * @param {String|undefined} [bbox] - The BBOX to search for features.
 * @param {String|undefined} [srsName] - The SRS to be used for returned features.
 * @returns {ol/Feature[]} All features of the layer or an empty array.
 */
async function getAllFeaturesByLayerId (layerId, bbox, srsName) {
    if (typeof layerId !== "string") {
        console.error(`utils/features/getAllFeaturesByLayerId: layerId must be a string. Got ${typeof layerId} instead.`);
        return [];
    }
    const layer = rawLayerList.getLayerWhere({id: layerId}),
        wfsReader = new WFS({
            featureNS: layer?.featureNS
        });
    let features = [];

    if (layer === null) {
        console.error(`utils/features/getAllFeaturesByLayerId: layer with the passed layerId (${layerId}) was not found.`);
        return [];
    }

    features = await getFeatureGET(layer.url, {
        service: "WFS",
        request: "GetFeature",
        version: layer.version,
        featureType: layer.featureType,
        bbox,
        srsName
    });

    return wfsReader.readFeatures(features);
}

module.exports = {
    getAllFeaturesByLayerId
};
