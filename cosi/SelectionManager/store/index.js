import getters from "./gettersSelectionManager";
import mutations from "./mutationsSelectionManager";
import state from "./stateSelectionManager";
import actions from "./actionsSelectionManager";

export default {
    namespaced: true,
    state: {...state},
    mutations,
    getters,
    actions
};
