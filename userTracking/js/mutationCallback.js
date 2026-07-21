import {handleClearRedoForFeatureForMeasure} from "./handler/handleClearRedoForFeatureForMeasure.js";
import {handleSetLayerInfo} from "./handler/handleSetLayerInfo.js";
import {handleSetProcessDataForPopulationRequest} from "./handler/handleSetProcessDataForPopulationRequest.js";
import {handleSetSearchedWfsSearch} from "./handler/handleSetSearchedWfsSearch.js";

/**
 * Evaluates a committed Vuex mutation and triggers the corresponding Matomo tracking event.
 * @param {Object} mutation The committed Vuex mutation.
 * @param {String} mutation.type The type identifier of the mutation.
 * @param {*} mutation.payload The payload carried by the mutation.
 * @param {Object} store The Vuex store.
 * @returns {void}
 */
export function mutationCallback (mutation, store) {
    try {
        switch (mutation.type) {
            case "Modules/LayerInformation/setLayerInfo":
                handleSetLayerInfo(mutation.payload, store);
                break;
            case "Modules/Measure/clearRedoForFeature":
                handleClearRedoForFeatureForMeasure();
                break;
            case "Modules/PopulationRequest/setProcessData":
                handleSetProcessDataForPopulationRequest(mutation.payload);
                break;
            case "Modules/WfsSearch/setSearched":
                handleSetSearchedWfsSearch(mutation.payload);
                break;
            default:
                break;
        }
    }
    catch (error) {
        console.error(`Vuex-store callback failed for mutation "${mutation.type}"`);
    }
}
