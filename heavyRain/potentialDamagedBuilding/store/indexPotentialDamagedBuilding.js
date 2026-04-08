import mutations from "./mutationsPotentialDamagedBuilding.js";
import getters from "./gettersPotentialDamagedBuilding.js";
import state from "./statePotentialDamagedBuilding.js";

export default {
    namespaced: true,
    state: {...state},
    mutations,
    getters
};
