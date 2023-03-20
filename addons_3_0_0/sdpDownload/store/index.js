import getters from "./gettersSdpDownload";
import mutations from "./mutationsSdpDownload";
import actions from "./actionsSdpDownload";
import state from "./stateSdpDownload";

export default {
    namespaced: true,
    state: {...state},
    mutations,
    getters,
    actions
};
