import getters from "./gettersGeoMarker";
import state from "./stateGeoMarker";
import actions from "./actionsGeoMarker";
import mutations from "./mutationsGeoMarker";

export default {
    namespaced: true,
    state: {...state},
    getters,
    actions,
    mutations
};

