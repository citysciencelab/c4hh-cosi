import isObject from "../../../src/shared/js/utils/isObject.js";
import rawLayerList from "@masterportal/masterportalapi/src/rawLayerList";
import layerFactory from "../../../src/core/layers/js/layerFactory.js";

/**
 * Gets the printed layers from layer Ids
 * @param {String[]} layerIds the layer id
 * @returns {[ol/layer, opacity]} printedLayers the printed layer and its opacity in an Array list
 */
export default function getPrintedLayers (layerIds) {
    const printedLayers = [];

    if (Array.isArray(layerIds) && layerIds.length) {
        layerIds.forEach(async layerId => {
            let layerObj = null,
                layer = {};

            if (isObject(layerId)) {
                layerObj = Object.assign({
                    opacity: 1,
                    dpi: 200
                }, layerId);
            }
            else if (typeof layerId === "string") {
                layerObj = {
                    layerId,
                    opacity: 1,
                    dpi: 200
                };
            }
            else {
                return;
            }

            layer = layerFactory.createLayer(rawLayerList.getLayerWhere({id: layerId}))?.layer;

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
