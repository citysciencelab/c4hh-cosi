import getters from "./gettersPlanParken.js";
import mutations from "./mutationsPlanParken.js";
import state from "./statePlanParken.js";

export default {
    namespaced: true,
    state: {...state},
    mutations,
    getters
};
