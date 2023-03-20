import actions from "./actionsRefugeeHomes";
import mutations from "./mutationsRefugeeHomes";
import getters from "./gettersRefugeeHomes";
import state from "./stateRefugeeHomes";

export default {
    namespaced: true,
    state: {...state},
    mutations,
    actions,
    getters
};
