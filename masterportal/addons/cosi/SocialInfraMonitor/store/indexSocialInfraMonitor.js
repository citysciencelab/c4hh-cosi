import getters from "./gettersSocialInfraMonitor";
import mutations from "./mutationsSocialInfraMonitor";
import state from "./stateSocialInfraMonitor";

export default {
    namespaced: true,
    state: {...state},
    mutations,
    getters
};
