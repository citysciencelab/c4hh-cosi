import mutations from "./mutationsFloodRiskManagement.js";
import getters from "./gettersFloodRiskManagement.js";
import state from "./stateFloodRiskManagement.js";
import actions from "./actionsFloodRiskManagement.js";

export default {
    namespaced: true,
    state: {...state},
    mutations,
    getters,
    actions
};
