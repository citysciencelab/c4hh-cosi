import getters from "./gettersTacticalMark";
import mutations from "./mutationsTacticalMark";
import state from "./stateTacticalMark";

export default {
    namespaced: true,
    state: {...state},
    mutations,
    getters
};
