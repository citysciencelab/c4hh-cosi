import getters from "./gettersLzsResearchClient";
import state from "./stateLzsResearchClient";
import actions from "./actionsLzsResearchClient";
import mutations from "./mutationsLzsResearchClient";

export default {
    namespaced: true,
    state: {...state},
    getters,
    actions,
    mutations
};

