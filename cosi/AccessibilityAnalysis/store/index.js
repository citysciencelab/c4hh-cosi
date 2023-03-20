import getters from "./gettersAccessibilityAnalysis";
import mutations from "./mutationsAccessibilityAnalysis";
<<<<<<< HEAD
import actions from "./actionsAccessibilityAnalysis";
=======
// import actions from "./actionsAccessibilityAnalysis";
>>>>>>> 39389637 (add new addons_3_0_0 structure-add missing addons)
import state from "./stateAccessibilityAnalysis";


export default {
    namespaced: true,
    state: {...state},
    mutations,
<<<<<<< HEAD
    getters,
    actions
=======
    getters
    // actions
>>>>>>> 39389637 (add new addons_3_0_0 structure-add missing addons)
};
