import actions from "./actionsVcOblique";
import mutations from "./mutationsVcOblique";
import getters from "./gettersVcOblique";
import state from "./stateVcOblique";

export default {
    namespaced: true,
    state: {...state},
    mutations,
    actions,
    getters
};
