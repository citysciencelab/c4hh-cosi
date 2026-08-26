import {trackMatomoEvent} from "../trackMatomo.js";
import {assembleSourceInfoForEvent, getLayerInformation, isPayloadValid} from "../util.js";

/**
 * Tracks a layer visibility change via the layer tree.
 * Triggered by: Toggling a layer's visibility via the layer tree ("Themen hinzufügen").
 * @param {Object} payload The action payload.
 * @param {Boolean} payload.value The new visibility state; true means the layer was added and turned on, false means it was removed.
 * @param {String} payload.layerId The id of the layer whose visibility changed.
 * @param {Object} store The vuex store.
 * @returns {void}
 */
export function handleChangeVisibility (payload, store) {
    const funcName = "handleChangeVisibility";

    if (
        !isPayloadValid({funcName, payload})
        || payload.value === undefined
        || payload.layerId === undefined
    ) {
        return;
    }

    trackMatomoEvent({
        category: "Layer",
        action: `${payload.value
            ? "Added layer via layertree and turned it on"
            : "Removed layer via layertree"
        }`,
        name: getLayerInformation(payload.layerId, store),
        _source: assembleSourceInfoForEvent(funcName)
    });
}
