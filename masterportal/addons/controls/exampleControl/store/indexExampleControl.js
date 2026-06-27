import actions from "./actionsExampleControl.js";
import getters from "./gettersExampleControl.js";
import mutations from "./mutationsExampleControl.js";
import state from "./stateExampleControl.js";

export default {
    namespaced: true,
    state: {...state},
    actions,
    mutations,
    getters
};
