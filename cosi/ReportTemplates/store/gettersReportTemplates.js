import {generateSimpleGetters} from "../../../../src/app-store/utils/generators";
import ReportTemplatesState from "./stateReportTemplates";

const getters = {
    ...generateSimpleGetters(ReportTemplatesState)
};

export default getters;
