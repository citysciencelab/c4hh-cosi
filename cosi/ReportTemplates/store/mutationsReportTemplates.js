import {generateSimpleMutations} from "../../../../src/app-store/utils/generators";
import ReportTemplatesState from "./stateReportTemplates";
const mutations = {
    ...generateSimpleMutations(ReportTemplatesState),
    templateItemOutput (state, {output, itemID}) { // to overwrite a specific key of a specific array item
        state.templateItems[itemID].output = output;
<<<<<<< HEAD
=======
        state.templateItems[itemID].hasOutput = true;

>>>>>>> a3a39d38 (add new addons_3_0_0 structure-add missing addons)
    }
};

export default mutations;
