import ReportingTool from "./components/ReportingTool.vue";
import ReportingToolStore from "./store/indexReportingTool";
import deLocale from "./locales/de/additional.json";
import enLocale from "./locales/en/additional.json";

export default {
    component: ReportingTool,
    store: ReportingToolStore,
    locales: {
        de: deLocale,
        en: enLocale
    }
};
