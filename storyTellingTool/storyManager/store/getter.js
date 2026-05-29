import {generateSimpleGetters} from "@shared/js/utils/generators";
import stateStoryManager from "./state.js";

const getters = {
    ...generateSimpleGetters(stateStoryManager)
};

export default getters;
