import getters from "./gettersGeoAnalyze";
import mutations from "./mutationsGeoAnalyze";
import state from "./stateGeoAnalyze";

export default {
    namespaced: true,
    state: {...state},
    mutations,
    getters
};
