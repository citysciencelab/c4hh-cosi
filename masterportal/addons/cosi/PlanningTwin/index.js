import PlanningTwin from "./components/PlanningTwin.vue";
import PlanningTwinStore from "./store/indexPlanningTwin";
import deLocale from "./locales/de/additional.json";
import enLocale from "./locales/en/additional.json";

export default {
    component: PlanningTwin,
    store: PlanningTwinStore,
    locales: {
        de: deLocale,
        en: enLocale
    }
};
