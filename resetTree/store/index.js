import getters from "./gettersResetTree";
import mutations from "./mutationsResetTree";
import state from "./stateResetTree";

export default {
    namespaced: true,
    state: {...state},
    mutations,
    getters
};
