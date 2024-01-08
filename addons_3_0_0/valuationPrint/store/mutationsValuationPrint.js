import {generateSimpleMutations} from "../../../../src_3_0_0/shared/js/utils/generators";
import stateGeoAnalyze from "./stateValuationPrint";

const mutations = {
    /**
     * Creates from every state-key a setter.
     * For example, given a state object {key: value}, an object
     * {setKey:   (state, payload) => *   state[key] = payload * }
     * will be returned.
     */
    ...generateSimpleMutations(stateGeoAnalyze)
};

export default mutations;
