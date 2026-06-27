import getters from "./gettersTemplateManager";
import mutations from "./mutationsTemplateManager";
import state from "./stateTemplateManager";
import actions from "./actionsTemplateManager";

export default {
    namespaced: true,
    state,
    mutations,
    getters,
    actions
};
