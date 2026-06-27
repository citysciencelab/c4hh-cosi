import actions from "./actionsMietenspiegelFormular.js";
import mutations from "./mutationsMietenspiegelFormular.js";
import getters from "./gettersMietenspiegelFormular.js";
import state from "./stateMietenspiegelFormular.js";

export default {
    namespaced: true,
    state: {...state},
    actions,
    mutations,
    getters
};
