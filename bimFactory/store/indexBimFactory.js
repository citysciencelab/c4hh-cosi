import getters from "./gettersBimFactory.js";
import state from "./stateBimFactory.js";
import actions from "./actionsBimFactory.js";
import mutations from "./mutationsBimFactory.js";

export default {
    namespaced: true,
    state: {...state},
    getters,
    actions,
    mutations
};

