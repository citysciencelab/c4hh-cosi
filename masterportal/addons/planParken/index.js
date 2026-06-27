import PlanParken from "./components/PlanParken.vue";
import PlanParkenStore from "./store/indexPlanParken.js";
import deLocale from "./locales/de/additional.json";
import enLocale from "./locales/en/additional.json";

export default {
    component: PlanParken,
    store: PlanParkenStore,
    locales: {
        de: deLocale,
        en: enLocale
    }
};
