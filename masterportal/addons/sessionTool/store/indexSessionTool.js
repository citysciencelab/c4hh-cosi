import actions from "./actionsSessionTool.js";
import getters from "./gettersSessionTool.js";
import mutations from "./mutationsSessionTool.js";
import state from "./stateSessionTool.js";

export default {
    namespaced: true,
    state: {...state},
    mutations,
    actions,
    getters
};
