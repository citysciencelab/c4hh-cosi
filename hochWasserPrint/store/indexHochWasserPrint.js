import actions from "./actionsHochWasserPrint";
import state from "./stateHochWasserPrint";
import getters from "./gettersHochWasserPrint";
import mutations from "./mutationsHochWasserPrint";

export default {
    namespaced: true,
    state: {...state},
    mutations,
    actions,
    getters
};
