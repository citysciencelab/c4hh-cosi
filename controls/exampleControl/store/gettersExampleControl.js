import {generateSimpleGetters} from "@shared/js/utils/generators";
import stateExampleControl from "./stateExampleControl";

export default {
    ...generateSimpleGetters(stateExampleControl)
};
