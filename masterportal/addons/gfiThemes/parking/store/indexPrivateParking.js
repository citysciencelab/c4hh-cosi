import state from "./statePrivateParking.js";
import getters from "./gettersPrivateParking.js";
import mutations from "./mutationsPrivateParking.js";

export default {
    namespaced: true,
    state: {...state},
    getters,
    mutations
};
