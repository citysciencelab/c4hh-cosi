import getters from "./gettersDashboard";
import mutations from "./mutationsDashboard";
import state from "./stateDashboard";
import actions from "./actionsDashboard";

export default {
    namespaced: true,
    state,
    mutations,
    getters,
    actions
};
