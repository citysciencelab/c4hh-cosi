import mutations from "./mutationsWaterRiskCheck.js";
import getters from "./gettersWaterRiskCheck.js";
import state from "./stateWaterRiskCheck.js";
import actions from "./actionsWaterRiskCheck.js";

export default {
    namespaced: true,
    state: {...state},
    mutations,
    getters,
    actions
};
