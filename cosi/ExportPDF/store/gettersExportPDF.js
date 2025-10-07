
import {generateSimpleGetters} from "../../../../src/shared/js/utils/generators";
import state from "./stateExportPDF";

export default {
    ...generateSimpleGetters(state)
};
