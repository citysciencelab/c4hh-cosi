import getters from "./gettersBimFactory";
import state from "./stateBimFactory";

export default {
    namespaced: true,
    state: {...state},
    getters
};

