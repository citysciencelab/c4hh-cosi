import {trackMatomoEvent} from "../trackMatomo";
import {assembleSourceInfoForEvent, getLayerInformation, isPayloadValid} from "../util";

/**
 * Tracks a click on the "show layers of folder" button in the search bar results.
 * Triggered by: Activating the "showInTree" action for a search bar result (e.g. clicking the button to show a layer's folder in the layer tree).
 * @param {Object} payload The action payload.
 * @param {String} payload.actionName The name of the activated action; only "showInTree" is tracked.
 * @param {Object} payload.actionArgs The arguments of the activated action.
 * @param {String} payload.actionArgs.layerId The id of the layer to be shown in the tree.
 * @param {Object} store The vuex store.
 * @returns {void}
 */
export function handleActivateActionforSearchBar (payload, store) {
    const funcName = "handleActivateActionforSearchBar";

    if (
        !isPayloadValid({funcName, payload})
        || !payload.actionArgs) {
        return;
    }

    if (payload.actionName === "showInTree") {
        trackMatomoEvent({
            category: "Layer",
            action: "Clicked on \"show-layers-of-folder\"-button",
            name: getLayerInformation(payload.actionArgs.layerId, store),
            _source: assembleSourceInfoForEvent(funcName)
        });
    }
}
