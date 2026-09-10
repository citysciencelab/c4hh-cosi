import {trackMatomoEvent} from "../trackMatomo.js";
import {assembleSourceInfoForEvent, getLayerInformation, getSourceFromPayload, isPayloadValid} from "../util.js";

/**
 * Tracks opening the layer information panel for a layer.
 * Triggered by: Clicking the info button of a layer or on a layer pill.
 * @param {Object} payload The layer configuration the Pinia action has been called with.
 * @param {String} payload.id The ID of the layer whose information is shown.
 * @param {String} payload._source The source that triggered the layer info display.
 * @param {Object} store The Vuex store.
 * @returns {void}
 */
export function handleSetLayerInfo (payload, store) {
    const funcName = "handleSetLayerInfo";

    if (!isPayloadValid({funcName, payload})) {
        return;
    }

    trackMatomoEvent({
        category: "Layer",
        action: `Opened layer information via ${getSourceFromPayload(payload)}`,
        name: getLayerInformation(payload.id, store),
        _source: assembleSourceInfoForEvent(funcName, payload._source)
    });
}
