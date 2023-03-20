import {Radio} from "backbone";

/**
 * Returns the layerModel with the given attributes.
 * Can be done directly or is no longer needed, if modelList is refactored.
 * @param {Object} attribute defines the attribute by which layerModels are requested
 * @returns {void}
 */
export function getLayerModelsByAttributes (attribute) {
    return Radio.request("ModelList", "getModelsByAttributes", attribute);
}
/**
 * Returns the layerModel with the given attributes.
 * Can be done directly or is no longer needed, if modelList is refactored.
 * @param {Object} id defines the id by which the layerModel is requested
 * @returns {void}
 */
export function getLayerModelByAttributes ({id}) {
    return Radio.request("ModelList", "getModelByAttributes", {id});
}
