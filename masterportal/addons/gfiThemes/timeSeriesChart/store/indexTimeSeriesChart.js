import getters from "./gettersTimeSeriesChart.js";
import mutations from "./mutationsTimeSeriesChart.js";
import state from "./stateTimeSeriesChart.js";
import actions from "./actionsTimeSeriesChart.js";

export default {
    namespaced: true,
    state: {...state},
    mutations,
    getters,
    actions
};
