import state from "./stateToolBridge";
import actions from "./actionsToolBridge";
import getters from "./gettersToolBridge";
import mutations from "./mutationsToolBridge";

export default {
    namespaced: true,
    state: {...state},
    mutations,
    actions,
    getters
};
