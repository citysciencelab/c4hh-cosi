import getters from "./gettersDataNarrator.js";
import state from "./stateDataNarrator.js";
import mutations from "./mutationsDataNarrator.js";

export default {
    namespaced: true,
    state: {...state},
    getters,
    mutations
};

