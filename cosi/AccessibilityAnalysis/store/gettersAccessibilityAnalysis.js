
import {generateSimpleGetters} from "../../../../src/shared/js/utils/generators";
import stateAccessibilityAnalysis from "./stateAccessibilityAnalysis";
// import {getServiceUrl} from "../../utils/radioBridge.js";

const getters = {
    ...generateSimpleGetters(stateAccessibilityAnalysis)
};

export default getters;
