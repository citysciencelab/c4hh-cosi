import state from "./stateCombinedGfi.js";
import {generateSimpleMutations} from "../../../../src/shared/js/utils/generators.js";

const mutations = {
    /**
     * Generates simple mutations for the state.
     *
     * @function
     * @param {Object} state - The state object.
     * @returns {Object} The generated mutations.
     */
    ...generateSimpleMutations(state)
};

export default mutations;
