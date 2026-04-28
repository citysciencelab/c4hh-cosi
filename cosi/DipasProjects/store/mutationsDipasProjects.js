import {generateSimpleMutations} from "@shared/js/utils/generators";
import stateDipasProjects from "./stateDipasProjects";

const mutations = {
    /**
     * Creates from every state-key a setter.
     * For example, given a state object {key: value}, an object
     * {setKey:   (state, payload) => *   state[key] = payload * }
     * will be returned.
     */
    ...generateSimpleMutations(stateDipasProjects)
};

export default mutations;
