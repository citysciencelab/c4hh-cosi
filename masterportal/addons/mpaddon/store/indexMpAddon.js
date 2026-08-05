import actions from "./actionsMpAddon";
import getters from "./gettersMpAddon";
import mutations from "./mutationsMpAddon";
import state from "./stateMpAddon";

export default {
    namespaced: true,
    state: {...state},
    actions,
    mutations,
    getters
};
