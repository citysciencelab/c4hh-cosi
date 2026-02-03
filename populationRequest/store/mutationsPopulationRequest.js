import {generateSimpleMutations} from "../../../src/shared/js/utils/generators.js";
import statePopulationRequest from "./statePopulationRequest.js";

const mutations = {
    /**
     * Creates from every state-key a setter.
     * For example, given a state object {key: value}, an object
     * {setKey:   (state, payload) => *   state[key] = payload * }
     * will be returned.
     */
    ...generateSimpleMutations(statePopulationRequest),

    /**
     * Sets the rasterLayer active setting.
     * @param {Object} state The state
     * @param {Boolean} payload The value to set
     * @returns {void}
     */
    setRasterActive (state, payload) {
        state.rasterActive = payload;
    },

    /**
     * Sets the alkisAdresses active setting.
     * @param {Object} state The state
     * @param {Boolean} payload The value to set
     * @returns {void}
     */
    setAlkisAdressesActive (state, payload) {
        state.alkisAdressesActive = payload;
    }
};

export default mutations;
