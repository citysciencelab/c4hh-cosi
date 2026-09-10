import {trackMatomoEvent} from "../trackMatomo.js";
import {assembleSourceInfoForEvent, getSourceFromPayload, isPayloadValid} from "../util.js";

/**
 * Tracks toggling a layer's visibility via the layer config.
 * Only fires when the update exclusively changes the layer visibility (payload contains exactly id and visibility).
 * Triggered by: Toggling a layer's checkbox in the layer tree or layer selection.
 * @param {Object} payload The action payload.
 * @param {Object[]} payload.layerConfigs Array of layer config update objects.
 * @param {Object} payload.layerConfigs[].layer The layer properties to update.
 * @param {String} payload.layerConfigs[].layer.id The layer ID.
 * @param {Boolean} payload.layerConfigs[].layer.visibility The new visibility state.
 * @param {String} [payload._source] The source component that triggered the action; included in the tracking event.
 * @param {Object} store The Vuex store.
 * @returns {void}
 */
export function handleReplaceByIdInLayerConfig (payload, store) {
    const funcName = "handleReplaceByIdInLayerConfig";

    if (!isPayloadValid({funcName, payload})) {
        return;
    }

    const {layer} = payload.layerConfigs[0];

    if (Object.keys(layer).length === 2 && layer.id !== undefined && layer.visibility !== undefined) {
        trackMatomoEvent({
            category: "Layer",
            action: `Changed layer-visibility via ${getSourceFromPayload(payload)}`,
            name: `Layer: ${store.getters.layerConfigById(layer.id)?.name} (id: ${layer.id})`,
            value: layer.visibility ? 1 : 0,
            _source: assembleSourceInfoForEvent(funcName, payload._source)
        });
    }
}
