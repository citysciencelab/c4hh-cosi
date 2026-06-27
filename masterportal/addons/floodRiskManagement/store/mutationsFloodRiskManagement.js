import {generateSimpleMutations} from "../../../src/shared/js/utils/generators.js";
import stateFloodRiskManagement from "././stateFloodRiskManagement.js";

const mutations = {
    /**
     * Creates from every state-key a setter.
     * For example, given a state object {key: value}, an object
     * {setKey:   (state, payload) => *   state[key] = payload * }
     * will be returned.
     */
    ...generateSimpleMutations(stateFloodRiskManagement),

    /**
     * Sets the state values for displaying an auto adjusted scale.
     * @param {Object} state Context object.
     * @param {Boolean} checkValue Value of the checkbox.
     * @returns {void}
     */
    setAutoAdjustScale: (state, checkValue) => {
        state.autoAdjustScale = checkValue;
        state.isScaleSelectedManually = false;
    }
};

export default mutations;
