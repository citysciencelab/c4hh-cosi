import {generateSimpleMutations} from "../../../../src/shared/js/utils/generators";
import state from "./stateReportingTool";

export default {
    ...generateSimpleMutations(state)
};
