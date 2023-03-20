import isObject from "../../../src/utils/isObject.js";

/**
 * Gets the printed layers from layer Ids
 * @param {String[]} layerIds the layer id
 * @returns {[ol/layer, opacity]} printedLayers the printed layer and its opacity in an Array list
 */
export default function getPrintedLayers (layerIds) {
    const printedLayers = [];

    if (Array.isArray(layerIds) && layerIds.length) {
        layerIds.forEach(layerId => {
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

            Radio.trigger("ModelList", "addModelsByAttributes", {id: layerObj.layerId});
            layer = Radio.request("ModelList", "getModelByAttributes", {id: layerObj.layerId})?.layer;

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
