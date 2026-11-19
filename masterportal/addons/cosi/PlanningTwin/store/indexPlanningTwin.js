import getters from "./gettersPlanningTwin";
import mutations from "./mutationsPlanningTwin";
import state from "./statePlanningTwin";

export default {
    namespaced: true,
    state: {...state},
    mutations,
    getters
};
