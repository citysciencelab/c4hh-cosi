import state from "./stateLanguage.js";
import actions from "./actionsLanguage.js";
import getters from "./gettersLanguage.js";
import mutations from "./mutationsLanguage.js";

export default {
    namespaced: true,
    state,
    actions,
    getters,
    mutations
};
