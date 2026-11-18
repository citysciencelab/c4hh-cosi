import getters from "./gettersLandRegistryFile.js";
import state from "./stateLandRegistryFile.js";
import actions from "./actionsLandRegistryFile.js";
import mutations from "./mutationsLandRegistryFile.js";

export default {
    namespaced: true,
    state: {...state},
    getters,
    actions,
    mutations
};

