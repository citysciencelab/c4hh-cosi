import getters from "./gettersTrafficCount.js";
import mutations from "./mutationsTrafficCount.js";
import state from "./stateTrafficCount.js";

export default {
    namespaced: true,
    state: {...state},
    mutations,
    getters
};
