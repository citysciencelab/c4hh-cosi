import getters from "./gettersQuickResponseCode";
import mutations from "./mutationsQuickResponseCode";
import state from "./stateQuickResponseCode";

export default {
    namespaced: true,
    state: {...state},
    mutations,
    getters
};
