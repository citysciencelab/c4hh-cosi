import getters from "./gettersDipas";
import mutations from "./mutationsDipas";
import state from "./stateDipas";
import actions from "./actionsDipas";


export default {
    namespaced: true,
    state: {...state},
    mutations,
    getters,
    actions
};
