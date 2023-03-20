import getters from "./gettersVueAddon";
import mutations from "./mutationsVueAddon";
import state from "./stateVueAddon";

export default {
    namespaced: true,
    state: {...state},
    mutations,
    getters
};
