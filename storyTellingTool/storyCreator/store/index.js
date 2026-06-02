import mutations from "./mutations.js";
import getters from "./getter.js";
import actions from "./actions.js";
import state from "./state.js";

export default {
    namespaced: true,
    state: {...state},
    mutations,
    actions,
    getters
};
