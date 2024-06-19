import BuildSpec from "../../../src/modules/print/js/buildSpec.js";
import isObject from "../../../src/shared/js/utils/isObject.js";

/**
 * Parses the layers into mapfisch format
 * @param {Object[]} layerList an array of objects with layer, opacity and dpi
 * @returns {ol/layer[]} the parsed layers in an Array for mapfish
 */
async function buildLayers (layerList) {
    const layers = [],
        currentResolution = mapCollection.getMapView("2D").getResolution();

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
