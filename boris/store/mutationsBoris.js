import {generateSimpleMutations} from "../../../src/app-store/utils/generators";
import stateBoris from "./stateBoris";

const mutations = {
    /**
     * Creates from every state-key a setter.
     * For example, given a state object {key: value}, an object
     * {setKey:   (state, payload) => *   state[key] = payload * }
     * will be returned.
     */
    ...generateSimpleMutations(stateBoris)
};

export default mutations;
