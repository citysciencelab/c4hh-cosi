import getters from "./gettersCommuterFlows";
import mutations from "./mutationsCommuterFlows";
import state from "./stateCommuterFlows";

export default {
    namespaced: true,
    state: {...state},
    mutations,
    getters
};
