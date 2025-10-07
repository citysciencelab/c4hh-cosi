import ReportTemplatesComponent from "./components/ReportTemplates.vue";
import ReportTemplatesStore from "./store/indexReportTemplates";
import deLocale from "./locales/de/additional.json";
import enLocale from "./locales/en/additional.json";

export default {
    component: ReportTemplatesComponent,
    store: ReportTemplatesStore,
    locales: {
        de: deLocale,
        en: enLocale
    }
};
