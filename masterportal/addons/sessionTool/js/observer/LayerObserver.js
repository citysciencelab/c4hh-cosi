import layerCollection from "../../../../src/core/layers/js/layerCollection.js";
import store from "../../../../src/app-store/index.js";

/**
 * Registers the Observer.
 * @param {Object} vueStore The store from the component.
 * @returns {void}
 */
function register (vueStore) {
    vueStore.dispatch("Modules/SessionTool/register", {key: "Layers", getter: getCurrentLayerList, setter: setLayers});
}

/**
 * Gets the current extent of the map.
 * @returns {Object} an object which holds the extent.
 */
function getCurrentLayerList () {
    const models = layerCollection.getLayers(),
        layerObjects = [];

    if (Array.isArray(models)) {
        models.forEach(model => layerObjects.push({
            id: model?.attributes?.id,
            visibility: model?.attributes?.visibility,
            zIndex: model?.attributes?.zIndex,
            transparency: model?.attributes?.transparency,
            showInLayerTree: model?.attributes?.showInLayerTree
        }));
    }
    return {
        layerIds: layerObjects
    };
}

/**
 * Sets the current layers.
 * @param {Object} payload The payload.
 * @param {Object} state The state which includes the payload.
 * @returns {Boolean} true if layers were set correctly, false otherwise.
 */
function setLayers (payload, state = false) {
    if (!Array.isArray(payload?.layerIds)) {
        return false;
    }
    const blacklist = getLayerIdBlacklistFromAccordions(state?.Filter?.selectedAccordions);


    payload.layerIds.forEach(layer => {
        if (Object.prototype.hasOwnProperty.call(blacklist, layer.id)) {
            return;
        }
        const model = getModelByLayerId(layer.id);

        if (!model) {
            store.dispatch("addOrReplaceLayer", {
                layerId: layer.id,
                visibility: typeof layer.visibility === "boolean" ? layer.visibility : true,
                transparency: typeof layer.transparency === "number" ? layer.transparency : 0,
                showInLayerTree: typeof layer.showInLayerTree === "boolean" ? layer.showInLayerTree : true,
                zIndex: typeof layer.zIndex === "number" ? layer.zIndex : 0
            });
        }
    });
    return true;
}

/**
 * Gets the model by given layerId.
 * @param {String} layerId The layerId.
 * @return {Boolean|ol/layer/Layer} returns false if layerId is not a string or a number otherwise returns the model.
 */
function getModelByLayerId (layerId) {
    if (typeof layerId !== "string" && typeof layerId !== "number") {
        return false;
    }

    const layers = layerCollection.getLayerById(layerId);
    let model;

    if (Array.isArray(layers) && layers.length > 0) {
        model = layers[0];
    }

    return model;
}
/**
 * Gets a blacklist of layer ids from given accordions.
 * @param {Object[]} accordions The array of accordions.
 * @returns {Object} An object with blacklisted layer ids as keys.
 */
function getLayerIdBlacklistFromAccordions (accordions) {
    const blacklist = {};

    if (!Array.isArray(accordions)) {
        return {};
    }
    accordions.forEach(accordion => {
        if (accordion?.category) {
            accordion.layers.forEach(accordionInCategory => {
                blacklist[accordionInCategory.layerId] = true;
            });
            return;
        }
        blacklist[accordion.layerId] = true;
    });
    return blacklist;
}


export {
    register,
    setLayers,
    getCurrentLayerList,
    getModelByLayerId,
    getLayerIdBlacklistFromAccordions
};
