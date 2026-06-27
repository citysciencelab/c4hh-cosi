import {generateSimpleMutations} from "../../../../src/shared/js/utils/generators";
import stateVueAddon from "./stateAccessibilityAnalysis";
// import Vue from "vue";

const mutations = {
    /**
     * Creates from every state-key a setter.
     * For example, given a state object {key: value}, an object
     * {setKey:   (state, payload) => *   state[key] = payload * }
     * will be returned.
     */
    ...generateSimpleMutations(stateVueAddon)
};

export default mutations;
