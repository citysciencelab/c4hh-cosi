import {generateSimpleMutations} from "../../../../src/shared/js/utils/generators";
import ReportTemplatesState from "./stateReportTemplates";

const mutations = {
    ...generateSimpleMutations(ReportTemplatesState),
    templateItemOutput (state, {output, itemID}) { // to overwrite a specific key of a specific array item
        state.templateItems[itemID].output = output;
    }
};

export default mutations;
