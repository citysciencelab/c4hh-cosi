import state from "./stateCombinedGfi.js";
import actions from "./actionsCombinedGfi.js";
import getters from "./gettersCombinedGfi.js";
import mutations from "./mutationsCombinedGfi.js";

export default {
    namespaced: true,
    state: {...state},
    actions,
    getters,
    mutations
};
