import {handleSetLayerInfo} from "./handler/handleSetLayerInfo.js";

/**
 * Evaluates a called Pinia action and triggers the corresponding Matomo tracking event.
 * @param {Object} action The called Pinia action.
 * @param {String} action.storeId The id of the Pinia store the action belongs to.
 * @param {String} action.name The name of the called action.
 * @param {Array} action.args The arguments the action has been called with.
 * @param {Object} store The Vuex store.
 * @returns {void}
 */
export function piniaActionCallback (action, store) {
    const actionType = `${action.storeId}/${action.name}`,
        payload = action.args[0];

    try {
        switch (actionType) {
            case "layerInformation/setLayerInfo":
                handleSetLayerInfo(payload, store);
                break;
            default:
                break;
        }
    }
    catch (error) {
        console.error(`Pinia-store callback failed for action "${actionType}": ${error.stack}`);
    }
}
