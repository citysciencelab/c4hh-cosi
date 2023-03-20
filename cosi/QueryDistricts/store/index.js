import getters from "./gettersQueryDistricts";
import mutations from "./mutationsQueryDistricts";
import state from "./stateQueryDistricts";


export default {
    namespaced: true,
    state: {...state},
    mutations,
    getters
};
