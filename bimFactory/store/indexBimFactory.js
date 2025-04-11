import getters from "./gettersBimFactory";
import state from "./stateBimFactory";
import actions from "./actionsBimFactory";
import mutations from "./mutationsBimFactory";

export default {
    namespaced: true,
    state: {...state},
    getters,
    actions,
    mutations
};

