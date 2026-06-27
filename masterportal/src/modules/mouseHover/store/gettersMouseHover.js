import {generateSimpleGetters} from "@shared/js/utils/generators.js";
import stateMouseHover from "./stateMouseHover.js";

const getters = {
    ...generateSimpleGetters(stateMouseHover)
};

export default getters;
