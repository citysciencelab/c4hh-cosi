
import {generateSimpleGetters} from "../../../../src/app-store/utils/generators";
import state from "./stateExportPDF";

export default {
    ...generateSimpleGetters(state)
};
