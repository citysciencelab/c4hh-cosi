import getters from "./gettersDipasProjects";
import mutations from "./mutationsDipasProjects";
import state from "./stateDipasProjects";
import actions from "./actionsDipasProjects";


export default {
    namespaced: true,
    state: {...state},
    mutations,
    getters,
    actions
};
