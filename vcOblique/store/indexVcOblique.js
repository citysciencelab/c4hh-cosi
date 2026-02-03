import actions from "./actionsVcOblique.js";
import mutations from "./mutationsVcOblique.js";
import getters from "./gettersVcOblique.js";
import state from "./stateVcOblique.js";

export default {
    namespaced: true,
    state: {...state},
    mutations,
    actions,
    getters
};
