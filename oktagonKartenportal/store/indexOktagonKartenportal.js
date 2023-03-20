import getters from "./gettersOktagonKartenportal";
import mutations from "./mutationsOktagonKartenportal";
import actions from "./actionsOktagonKartenportal";
import state from "./stateOktagonKartenportal";

export default {
    namespaced: true,
    state: {...state},
    mutations,
    actions,
    getters
};
