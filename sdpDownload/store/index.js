import getters from "./gettersSdpDownload.js";
import mutations from "./mutationsSdpDownload.js";
import actions from "./actionsSdpDownload.js";
import state from "./stateSdpDownload.js";

export default {
    namespaced: true,
    state: {...state},
    mutations,
    getters,
    actions
};
