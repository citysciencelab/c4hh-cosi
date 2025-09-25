import {generateSimpleMutations} from "../../../src/shared/js/utils/generators";
import stateOktagon from "./stateOktagon";

const mutations = {
    /**
     * Creates from every state-key a setter.
     * For example, given a state object {key: value}, an object
     * {setKey:   (state, payload) => *   state[key] = payload * }
     * will be returned.
     */
    ...generateSimpleMutations(stateOktagon)
};

export default mutations;
