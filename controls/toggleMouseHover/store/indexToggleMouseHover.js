import getters from "./gettersToggleMouseHover.js";
import mutations from "./mutationsToggleMouseHover.js";
import state from "./stateToggleMouseHover.js";

export default {
    namespaced: true,
    state: {...state},
    mutations,
    getters
};
