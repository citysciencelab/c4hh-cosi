import {generateSimpleGetters} from "@shared/js/utils/generators.js";
import stateExampleControl from "./stateExampleControl.js";

export default {
    ...generateSimpleGetters(stateExampleControl)
};
