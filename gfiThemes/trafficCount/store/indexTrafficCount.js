import getters from "./gettersTrafficCount";
import mutations from "./mutationsTrafficCount";
import state from "./stateTrafficCount";

export default {
    namespaced: true,
    state: {...state},
    mutations,
    getters
};
