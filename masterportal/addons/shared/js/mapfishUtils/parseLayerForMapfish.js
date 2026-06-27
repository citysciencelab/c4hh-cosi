import BuildSpec from "../../../../src/modules/print/js/buildSpec.js";
import isObject from "../../../../src/shared/js/utils/isObject.js";

/**
 * Parses the layers into mapfisch format
 * @param {Object[]} layerList an array of objects with layer, opacity and dpi
 * @param {Boolean} skipDefectLayerList If an element from the layerList is incorrect, the iteration is terminated and an empty array is returned.
 * @returns {ol/layer[]} the parsed layers in an Array for mapfish
 */
async function buildLayers (layerList, skipDefectLayerList = true) {
    const layers = [],
        currentResolution = mapCollection.getMapView("2D").getResolution();

    if (!Array.isArray(layerList)) {
        return layers;
    }

    for (const item of layerList) {
        if (!isObject(item)) {
            if (skipDefectLayerList === true) {
                return [];
            }
            continue;
        }
        const createdLayer = await BuildSpec.buildLayerType(item.layer, currentResolution, item.dpi, true);

        if (typeof createdLayer !== "undefined") {
            createdLayer.opacity = item.opacity;
            layers.push(createdLayer);
        }
    }

    return layers;
}

export {
    buildLayers
};
