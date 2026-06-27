import getters from "./gettersFeaturesList";
import mutations from "./mutationsFeaturesList";
import state from "./stateFeaturesList";
import actions from "./actionsFeaturesList";

export default {
    namespaced: true,
    state: {...state},
    mutations,
    getters,
    actions
};
