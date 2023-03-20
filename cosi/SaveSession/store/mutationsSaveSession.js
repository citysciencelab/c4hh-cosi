import {generateSimpleMutations} from "../../../../src/app-store/utils/generators";
import stateSaveSession from "./stateSaveSession";

const mutations = {
    /**
     * Creates from every state-key a setter.
     * For example, given a state object {key: value}, an object
     * {setKey:   (state, payload) => *   state[key] = payload * }
     * will be returned.
     */
    ...generateSimpleMutations(stateSaveSession)
};

export default mutations;
