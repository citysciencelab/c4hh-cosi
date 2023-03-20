import {getLayerSource} from "./getLayerSource";

/**
 * Returns all features of a layer list that match the given filter function.
 * @param {ol/layer/Vector[]} layerList - A list of vector layer.
 * @param {Function} filterFunction - The filter function.
 * @returns {ol/Feature[]|[]} The filtered features if any found otherwise an empty array.
 */
function filterAllFeatures (layerList, filterFunction) {
    if (!Array.isArray(layerList) || !layerList.length) {
        console.error(`utils/layer/findAllFeatures: The first parameter must be an non-empty array. Got ${typeof layerList} instead.`);
        return [];
    }
    if (typeof filterFunction !== "function") {
        console.error(`utils/layer/findAllFeatures: The second parameter must be a function. Got ${typeof filterFunction} instead.`);
        return [];
    }
    const allFeatures = [];

    layerList.forEach(layer => {
        const activeFeatures = getLayerSource(layer)?.getFeatures().filter(filterFunction);

        if (activeFeatures) {
            allFeatures.push(...activeFeatures);
        }
    });

    return allFeatures;
}

module.exports = {
    filterAllFeatures
};

