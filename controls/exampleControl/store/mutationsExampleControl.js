import {generateSimpleMutations} from "@shared/js/utils/generators";
import stateExampleControl from "./stateExampleControl";

export default {
    ...generateSimpleMutations(stateExampleControl)
};
