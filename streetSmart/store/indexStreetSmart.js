import actions from "./actionsStreetSmart.js";
import mutations from "./mutationsStreetSmart.js";
import getters from "./gettersStreetSmart.js";
import state from "./stateStreetSmart.js";

export default {
    namespaced: true,
    state: {...state},
    mutations,
    actions,
    getters
};
