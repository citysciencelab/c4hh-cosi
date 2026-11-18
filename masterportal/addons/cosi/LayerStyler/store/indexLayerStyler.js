import getters from "./gettersLayerStyler";
import mutations from "./mutationsLayerStyler";
import state from "./stateLayerStyler";

export default {
    namespaced: true,
    state: {...state},
    mutations,
    getters
};
