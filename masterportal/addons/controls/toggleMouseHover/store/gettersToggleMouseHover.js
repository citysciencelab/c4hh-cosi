import {generateSimpleGetters} from "@shared/js/utils/generators.js";
import stateToggleMouseHover from "./stateToggleMouseHover.js";

export default {
    ...generateSimpleGetters(stateToggleMouseHover)
};
