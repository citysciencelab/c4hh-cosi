import isObject from "../../../../src/shared/js/utils/isObject.js";
import rawLayerList from "@masterportal/masterportalapi/src/rawLayerList.js";
import layerFactory from "../../../../src/core/layers/js/layerFactory.js";

/**
 * Gets the printed layers from layer Ids
 * @param {String[]} layerIds the layer id
 * @param {Number} dpi the dpi of the layers object.
 * @returns {[ol/layer, opacity]} printedLayers the printed layer and its opacity in an Array list
 */
export default function getPrintedLayers (layerIds, dpi) {
    const printedLayers = [];

    if (Array.isArray(layerIds) && layerIds.length) {
        layerIds.forEach(async layerId => {
            let layerObj = null,
                layer = {},
                id;

            if (isObject(layerId)) {
                layerObj = Object.assign({
                    opacity: 1,
                    dpi
                }, layerId);
                id = layerId.layerId;
            }
            else if (typeof layerId === "string") {
                layerObj = {
                    layerId,
                    opacity: 1,
                    dpi
                };
                id = layerId;
            }
            else {
                return;
            }

            layer = layerFactory.createLayer(rawLayerList.getLayerWhere({id: id}))?.layer;

            if (typeof layer !== "undefined") {
                printedLayers.push({
                    layer,
                    opacity: layerObj.opacity,
                    dpi: layerObj.dpi
                });
            }
        });
    }

    return printedLayers;
}
