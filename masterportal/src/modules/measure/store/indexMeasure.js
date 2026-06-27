import getters from "./gettersMeasure.js";
import mutations from "./mutationsMeasure.js";
import actions from "./actionsMeasure.js";
import state from "./stateMeasure.js";
import "../js/typedefs.js";

export default {
    namespaced: true,
    state,
    mutations,
    actions,
    getters
};
