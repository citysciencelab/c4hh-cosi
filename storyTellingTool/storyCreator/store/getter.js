
import {generateSimpleGetters} from "@shared/js/utils/generators";
import stateStoryCreator from "./state.js";

const getters = {
    ...generateSimpleGetters(stateStoryCreator)
};

export default getters;
