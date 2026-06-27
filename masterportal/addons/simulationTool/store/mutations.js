import {generateSimpleMutations} from "../../../src/shared/js/utils/generators.js";
import state from "./state.js";

const mutations = {
    ...generateSimpleMutations(state)
};

export default mutations;
