import {generateSimpleGetters} from "../../../../src/shared/js/utils/generators";
import ReportTemplatesState from "./stateReportTemplates";

const getters = {
    ...generateSimpleGetters(ReportTemplatesState)
};

export default getters;
