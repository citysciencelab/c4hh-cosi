import {generateSimpleGetters} from "@shared/js/utils/generators";
import stateQuickResponseCode from "./stateQuickResponseCode";

export default {
    ...generateSimpleGetters(stateQuickResponseCode)
};
