import getters from "./gettersCalculateRatio";
import mutations from "./mutationsCalculateRatio";
import state from "./stateCalculateRatio";

export default {
    namespaced: true,
    state: {...state},
    mutations,
    getters
};
