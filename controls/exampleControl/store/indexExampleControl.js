import actions from "./actionsExampleControl";
import getters from "./gettersExampleControl";
import mutations from "./mutationsExampleControl";
import state from "./stateExampleControl";

export default {
    namespaced: true,
    state: {...state},
    actions,
    mutations,
    getters
};
