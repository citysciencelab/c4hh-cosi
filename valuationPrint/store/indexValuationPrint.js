import mutations from "./mutationsValuationPrint";
import getters from "./gettersValuationPrint";
import state from "./stateValuationPrint";

export default {
    namespaced: true,
    state: {...state},
    mutations,
    getters
};
