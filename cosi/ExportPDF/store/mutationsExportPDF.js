import {generateSimpleMutations} from "../../../../src/app-store/utils/generators";
import state from "./stateExportPDF";

export default {
    ...generateSimpleMutations(state)
};
