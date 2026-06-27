
import {generateSimpleGetters} from "../../../../src/shared/js/utils/generators";
import state from "./stateReportingTool";

export default {
    ...generateSimpleGetters(state)
};
