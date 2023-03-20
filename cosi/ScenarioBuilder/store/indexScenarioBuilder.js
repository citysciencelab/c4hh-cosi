import getters from "./gettersScenarioBuilder";
import mutations from "./mutationsScenarioBuilder";
import state from "./stateScenarioBuilder";
import actions from "./actionsScenarioBuilder";

export default {
    namespaced: true,
    state: {...state},
    mutations,
    getters,
    actions
};
