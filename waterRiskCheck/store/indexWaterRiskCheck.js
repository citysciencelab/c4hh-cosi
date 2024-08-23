import mutations from "./mutationsWaterRiskCheck";
import getters from "./gettersWaterRiskCheck";
import state from "./stateWaterRiskCheck";
import actions from "./actionsWaterRiskCheck";

export default {
    namespaced: true,
    state: {...state},
    mutations,
    getters,
    actions
};
