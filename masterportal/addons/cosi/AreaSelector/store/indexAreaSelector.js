import getters from "./gettersAreaSelector";
import mutations from "./mutationsAreaSelector";
import state from "./stateAreaSelector";

export default {
    namespaced: true,
    state,
    mutations,
    getters
};
