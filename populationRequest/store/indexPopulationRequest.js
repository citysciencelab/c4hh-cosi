import actions from "./actionsPopulationRequest.js";
import getters from "./gettersPopulationRequest.js";
import mutations from "./mutationsPopulationRequest.js";
import state from "./statePopulationRequest.js";

export default {
    namespaced: true,
    state: {...state},
    mutations,
    getters,
    actions
};
