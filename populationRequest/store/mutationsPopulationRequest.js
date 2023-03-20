import {generateSimpleMutations} from "../../../src/app-store/utils/generators";
import statePopulationRequest from "./statePopulationRequest";

const mutations = {
    /**
     * Creates from every state-key a setter.
     * For example, given a state object {key: value}, an object
     * {setKey:   (state, payload) => *   state[key] = payload * }
     * will be returned.
     */
    ...generateSimpleMutations(statePopulationRequest)
};

export default mutations;
