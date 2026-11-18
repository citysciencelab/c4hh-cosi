import getters from "./gettersLayerFilter";
import mutations from "./mutationsLayerFilter";
import state from "./stateLayerFilter";

export default {
    namespaced: true,
    state: {...state},
    mutations,
    getters
};
