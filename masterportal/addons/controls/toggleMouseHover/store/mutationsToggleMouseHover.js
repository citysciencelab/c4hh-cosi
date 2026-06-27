import {generateSimpleMutations} from "@shared/js/utils/generators.js";
import stateToggleMouseHover from "./stateToggleMouseHover.js";

export default {
    ...generateSimpleMutations(stateToggleMouseHover)
};
