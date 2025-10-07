import {generateSimpleMutations} from "../../../../src/shared/js/utils/generators";
import state from "./stateExportPDF";

export default {
    ...generateSimpleMutations(state)
};
