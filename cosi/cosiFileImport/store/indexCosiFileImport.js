import state from "./stateCosiFileImport";
import actions from "./actionsCosiFileImport";
import getters from "./gettersCosiFileImport";
import mutations from "./mutationsCosiFileImport";

export default {
    namespaced: true,
    state: {...state},
    mutations,
    actions,
    getters
};
