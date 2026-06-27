import getters from "./getters.js";
import mutations from "./mutations.js";
import actions from "./actions.js";
import state from "./state.js";

export default {
    namespaced: true,
    state,
    mutations,
    actions,
    getters
};
