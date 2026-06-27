import getters from "./gettersCommuterFlows.js";
import mutations from "./mutationsCommuterFlows.js";
import state from "./stateCommuterFlows.js";

export default {
    namespaced: true,
    state: {...state},
    mutations,
    getters
};
