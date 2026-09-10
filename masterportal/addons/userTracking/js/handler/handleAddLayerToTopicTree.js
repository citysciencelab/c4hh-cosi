import {trackMatomoEvent} from "../trackMatomo.js";
import {assembleSourceInfoForEvent, getLayerInformation, isPayloadValid} from "../util.js";

/**
 * Tracks adding a layer from the search results to the topic tree.
 * Triggered by: Add a layer in the search results.
 * @param {Object} payload The action payload.
 * @param {String} payload.layerId The id of the layer added to the topic tree.
 * @param {Object} store The vuex store.
 * @returns {void}
 */
export function handleAddLayerToTopicTree (payload, store) {
    const funcName = "handleAddLayerToTopicTree";

    if (!isPayloadValid({funcName, payload})) {
        return;
    }

    const {layerId} = payload;

    if (layerId !== undefined) {
        trackMatomoEvent({
            category: "Layer",
            action: "Added layer via search",
            name: getLayerInformation(layerId, store),
            _source: assembleSourceInfoForEvent(funcName)
        });
    }
}
