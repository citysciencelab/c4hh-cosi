import PopulationRequestComponent from "./components/PlanParken.vue";
import PopulationRequestStore from "./store/indexPlanParken.js";
import deLocale from "./locales/de/additional.json";
import enLocale from "./locales/en/additional.json";

export default {
    component: PopulationRequestComponent,
    store: PopulationRequestStore,
    locales: {
        de: deLocale,
        en: enLocale
    }
};
