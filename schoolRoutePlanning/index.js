import SchoolRoutePlanningComponent from "./components/SchoolRoutePlanning.vue";
import SchoolRoutePlanningStore from "./store/indexSchoolRoutePlanning";
import deLocale from "./locales/de/additional.json";
import enLocale from "./locales/en/additional.json";

export default {
    component: SchoolRoutePlanningComponent,
    store: SchoolRoutePlanningStore,
    locales: {
        de: deLocale,
        en: enLocale
    }
};
