import getters from "./gettersOktagon";
import mutations from "./mutationsOktagon";
import actions from "./actionsOktagon";
import state from "./stateOktagon";

export default {
    namespaced: true,
    state: {...state},
    mutations,
    actions,
    getters
};
