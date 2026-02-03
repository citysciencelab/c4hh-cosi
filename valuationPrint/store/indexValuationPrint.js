import mutations from "./mutationsValuationPrint.js";
import getters from "./gettersValuationPrint.js";
import state from "./stateValuationPrint.js";

export default {
    namespaced: true,
    state: {...state},
    mutations,
    getters
};
