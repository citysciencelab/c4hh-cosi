import {generateSimpleMutations} from "@shared/js/utils/generators.js";
import stateDistrictFinder from "./stateDistrictFinder";

const mutations = {
    /**
     * Creates from every state-key a setter.
     * For example, given a state object {key: value}, an object
     * {setKey:   (state, payload) => *   state[key] = payload * }
     * will be returned.
     */
    ...generateSimpleMutations(stateDistrictFinder)
};

export default mutations;
