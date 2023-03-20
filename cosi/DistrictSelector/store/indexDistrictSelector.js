import getters from "./gettersDistrictSelector";
import mutations from "./mutationsDistrictSelector";
import state from "./stateDistrictSelector";
import actions from "./actionsDistrictSelector";

export default {
    namespaced: true,
    state,
    mutations,
    getters,
    actions
};
