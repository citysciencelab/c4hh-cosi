import actions from "./actionsStreetSmart";
import mutations from "./mutationsStreetSmart";
import getters from "./gettersStreetSmart";
import state from "./stateStreetSmart";

export default {
    namespaced: true,
    state: {...state},
    mutations,
    actions,
    getters
};
