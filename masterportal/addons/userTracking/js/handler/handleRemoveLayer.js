import {trackMatomoEvent} from "../trackMatomo.js";
import {assembleSourceInfoForEvent, getLayerInformation, isPayloadValid} from "../util.js";

/**
 * Tracks removing a layer from the layer tree.
 * Triggered by: Clicking the remove button on a layer in the layer tree.
 * @param {Object} payload The action payload.
 * @param {String} payload.id The ID of the layer to remove.
 * @param {Object} store The Vuex store.
 * @returns {void}
 */
export function handleRemoveLayer (payload, store) {
    const funcName = "handleRemoveLayer";

    if (!isPayloadValid({funcName, payload})) {
        return;
    }

    trackMatomoEvent({
        category: "Layer",
        action: "Removed layer from layertree",
        name: getLayerInformation(payload.id, store),
        _source: assembleSourceInfoForEvent(funcName)
    });
}
