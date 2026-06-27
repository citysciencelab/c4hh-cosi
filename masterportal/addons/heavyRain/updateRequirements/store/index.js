import mutations from "./mutations.js";
import getters from "./getters.js";
import state from "./state.js";

export default {
    namespaced: true,
    state,
    mutations,
    getters
};
