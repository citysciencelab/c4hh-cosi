/* eslint-disable new-cap */
import {getFeatureGET as wfsGetFeature} from "../../../../src/api/wfs/getFeature.js";
import rawLayerList from "@masterportal/masterportalapi/src/rawLayerList";
import store from "../../../../src/app-store";
import {WFS} from "ol/format.js";
import {getLayerSource} from "../../utils/layer/getLayerSource";

const wfsReader = new WFS();

/**
 * returns the map layer by ID
 * @param {String} layerId - the layerId to look up
 * @returns {module:ol/Layer} the layer on the map
 */
function layerById (layerId) {
    return store.getters["Maps/getLayerById"]({layerId: layerId});
}

/**
 * Gets all possible values for a given field of a featureType
 * @param {String} field - the field's name
 * @param {String} layerId - the layerID of the layer to check
 * @returns {Promise<String[]>} the list of possible values
 */
export default async function getValuesForField (field, layerId) {
    let allFeatures;
    const rawLayer = rawLayerList.getLayerWhere({id: layerId});

    if (rawLayer) {
        const response = await wfsGetFeature(rawLayer.url, {
            featureType: rawLayer.featureType,
            version: rawLayer.version
        });

        allFeatures = wfsReader.readFeatures(response);
    }
    else {
        const layer = layerById(layerId),
            source = getLayerSource(layer);

        allFeatures = source.getFeatures();
    }

    return allFeatures.reduce((values_, feature) => {
        const val = feature.getProperties()[field];

        if (val && !values_.includes(val)) {
            values_.push(val);
        }

        return values_;
    }, []);
}
