import {generateSimpleMutations} from "@shared/js/utils/generators.js";
import stateExampleControl from "./stateExampleControl.js";

export default {
    ...generateSimpleMutations(stateExampleControl)
};
