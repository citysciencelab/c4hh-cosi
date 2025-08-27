import state from "./stateCombinedGfi";
import actions from "./actionsCombinedGfi";
import getters from "./gettersCombinedGfi";
import mutations from "./mutationsCombinedGfi";

export default {
    namespaced: true,
    state: {...state},
    actions,
    getters,
    mutations
};
