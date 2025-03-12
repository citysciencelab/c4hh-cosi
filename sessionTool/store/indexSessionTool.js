import actions from "./actionsSessionTool";
import getters from "./gettersSessionTool";
import mutations from "./mutationsSessionTool";
import state from "./stateSessionTool";

export default {
    namespaced: true,
    state: {...state},
    mutations,
    actions,
    getters
};
