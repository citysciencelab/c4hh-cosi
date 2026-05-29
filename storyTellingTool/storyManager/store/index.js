import mutations from "./mutations.js";
import getters from "./getter.js";
import state from "./state.js";

export default {
    namespaced: true,
    state: {...state},
    mutations,
    getters
};
