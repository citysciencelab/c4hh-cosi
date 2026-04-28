import getters from "./gettersDipasProjects";
import mutations from "./mutationsDipasProjects";
import state from "./stateDipasProjects";


export default {
    namespaced: true,
    state: {...state},
    mutations,
    getters
};
