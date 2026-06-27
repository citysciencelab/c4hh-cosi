import actions from "./actionsColorCodeMap";
import getters from "./gettersColorCodeMap";
import mutations from "./mutationsColorCodeMap";
import state from "./stateColorCodeMap";

export default {
    namespaced: true,
    state: {...state},
    actions,
    mutations,
    getters
};
