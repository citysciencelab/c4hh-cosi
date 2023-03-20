import BuildSpec from "./../../../src/modules/tools/print/utils/buildSpec";
import store from "../../../src/app-store";
import isObject from "../../../src/utils/isObject.js";

/**
 * Parses the layers into mapfisch format
 * @param {Object[]} layerList an array of objects with layer, opacity and dpi
 * @returns {ol/layer[]} the parsed layers in an Array for mapfish
 */
async function buildLayers (layerList) {
    const layers = [],
        currentResolution = store.getters["Maps/getView"].getResolution();

    if (Array.isArray(layerList)) {
        for (const item of layerList) {
            const printLayers = [];

            if (!isObject(item)) {
                return [];
            }

            printLayers.push(await BuildSpec.buildLayerType(item.layer, currentResolution, item.dpi, true));
            printLayers.forEach(printLayer => {
                if (typeof printLayer !== "undefined") {
                    printLayer.opacity = item.opacity;
                    layers.push(printLayer);
                }

            });
        }
    }

    return layers;
}

export {
    buildLayers
};
