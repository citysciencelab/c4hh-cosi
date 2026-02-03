import getters from "./gettersOktagon.js";
import mutations from "./mutationsOktagon.js";
import actions from "./actionsOktagon.js";
import state from "./stateOktagon.js";

export default {
    namespaced: true,
    state: {...state},
    mutations,
    actions,
    getters
};
