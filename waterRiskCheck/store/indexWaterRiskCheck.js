import mutations from "./mutationsWaterRiskCheck";
import getters from "./gettersWaterRiskCheck";
import state from "./stateWaterRiskCheck";

export default {
    namespaced: true,
    state: {...state},
    mutations,
    getters
};
