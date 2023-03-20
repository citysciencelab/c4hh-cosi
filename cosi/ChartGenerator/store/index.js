import getters from "./gettersChartGenerator";
import mutations from "./mutationsChartGenerator";
import state from "./stateChartGenerator";
import actions from "./actionsChartGenerator";

export default {
    namespaced: true,
    state: {...state},
    mutations,
    getters,
    actions
};
