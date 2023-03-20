import {generateSimpleMutations} from "../../../src/app-store/utils/generators";
import sessionToolState from "./stateSessionTool";

const mutations = {
    /**
     * Creates a setter from every state-key.
     * For example, given a state object {key: value}, an object
     * {setKey:   (state, payload) => *   state[key] = payload * }
     * will be returned.
     */
    ...generateSimpleMutations(sessionToolState),

    addObserver: (state, payload) => {
        state.observer.push(payload);
    }
};

export default mutations;
