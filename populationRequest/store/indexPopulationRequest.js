import getters from "./gettersPopulationRequest";
import mutations from "./mutationsPopulationRequest";
import state from "./statePopulationRequest";

export default {
    namespaced: true,
    state: {...state},
    mutations,
    getters
};
