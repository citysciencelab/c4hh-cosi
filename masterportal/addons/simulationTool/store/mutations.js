import {generateSimpleMutations} from "../../../src/shared/js/utils/generators.js";
import state from "./state.js";

const mutations = {
    ...generateSimpleMutations(state),

    setPlanningScenarioCurrentLayout (moduleState, options) {
        moduleState.planningScenarioCurrentLayout = {
            ...moduleState.planningScenarioCurrentLayout,
            ...options
        };
    }
};

export default mutations;
