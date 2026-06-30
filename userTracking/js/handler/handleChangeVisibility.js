import {trackMatomoEvent} from "../trackMatomo.js";
import {isPayloadValid} from "../util.js";

/**
 * Tracks adding a layer via the layertree.
 * Triggered by: Add a layer in the layer tree ("Themen hinzufügen").
 * @param {Object} payload The action payload.
 * @param {Boolean} payload.value The new visibility state of the layer; tracking only happens when true.
 * @param {String} payload.layerId The id of the layer whose visibility changed.
 * @param {Object} store The vuex store.
 * @returns {void}
 */
export function handleChangeVisibility (payload, store) {
    if (!isPayloadValid({funcName: handleChangeVisibility.name, payload})) {
        return;
    }

    if (payload.value) {
        const {layerId} = payload;

        if (layerId !== undefined) {
            trackMatomoEvent({
                category: "Layer",
                action: "Layer added via layertree",
                name: `${store.getters.layerConfigById(layerId)?.name} (layerId: ${layerId})`
            });
        }
    }
}
