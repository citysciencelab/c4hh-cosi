import getters from "./gettersWaterStatistics.js";
import mutations from "./mutationsWaterStatistics.js";
import state from "./stateWaterStatistics.js";
import actions from "./actionsWaterStatistics.js";

export default {
    namespaced: true,
    state: {...state},
    mutations,
    getters,
    actions
};
