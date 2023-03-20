/**
 * Radio bridge to get layers by given attributes.
 * @param {Object} attributes The attributes as object
 * @returns {ol/layer/Layer[]} The layers
 */
function getLayersByAttributes (attributes) {
    return Radio.request("ModelList", "getModelsByAttributes", attributes);
}
/**
 * Radio bridge to get layer by given attributes.
 * @param {Object} attributes The attributes as object
 * @returns {ol/layer/Layer} The layer
 */
function getLayerByAttributes (attributes) {
    return Radio.request("ModelList", "getModelByAttributes", attributes);
}
/**
 * Radio bridge to add a layer to the modellist.
 * @param {String} id The layer id
 * @returns {void}
 */
function addLayerByLayerId (id) {
    Radio.trigger("ModelList", "addModelsByAttributes", {id});
}

export {
    getLayerByAttributes,
    getLayersByAttributes,
    addLayerByLayerId
};
