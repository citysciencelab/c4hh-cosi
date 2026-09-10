import {trackMatomoEvent} from "../trackMatomo.js";
import {assembleSourceInfoForEvent, getLayerInformation, isPayloadValid} from "../util.js";

let timeoutId = null;

/**
 * Tracks adjusting a layer's transparency slider, debounced by 500 ms to avoid tracking every intermediate value.
 * Triggered by: Moving the transparency slider for a layer in the layer tree.
 * @param {Object} payload The action payload.
 * @param {Object} payload.layerConf The layer config object containing the updated transparency.
 * @param {String} payload.layerConf.id The layer ID.
 * @param {String|Number} payload.layerConf.transparency The new transparency value.
 * @param {Object} store The Vuex store.
 * @returns {void}
 */
export function handleUpdateLayerTransparency (payload, store) {
    const funcName = "handleUpdateLayerTransparency";

    if (!isPayloadValid({funcName, payload})) {
        return;
    }

    if (timeoutId !== null) {
        clearTimeout(timeoutId);
        timeoutId = null;
    }

    const {layerConf} = payload;

    timeoutId = setTimeout(() => {
        trackMatomoEvent({
            category: "Layer",
            action: "Changed transparency",
            name: getLayerInformation(layerConf.id, store),
            value: parseInt(layerConf.transparency, 10),
            _source: assembleSourceInfoForEvent(funcName)
        });
        timeoutId = null;
    }, 500);
}
