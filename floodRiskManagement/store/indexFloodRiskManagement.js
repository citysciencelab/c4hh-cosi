import mutations from "./mutationsFloodRiskManagement";
import getters from "./gettersFloodRiskManagement";
import state from "./stateFloodRiskManagement";
import actions from "./actionsFloodRiskManagement";

export default {
    namespaced: true,
    state: {...state},
    mutations,
    getters,
    actions
};
