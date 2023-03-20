import getters from "./gettersColorCodeMap";
import mutations from "./mutationsColorCodeMap";
import state from "./stateColorCodeMap";

export default {
    namespaced: true,
    state: {...state},
    mutations,
    getters
};
