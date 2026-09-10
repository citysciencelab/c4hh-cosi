import actions from "./actionsUserTracking.js";
import createInitialState from "./stateUserTracking.js";
import getters from "./gettersUserTracking.js";
import mutations from "./mutationsUserTracking.js";

export default {
    actions,
    getters,
    mutations,
    namespaced: true,
    state: createInitialState
};
