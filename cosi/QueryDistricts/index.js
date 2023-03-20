import QueryDistricts from "./components/QueryDistricts.vue";
import QueryDistrictsStore from "./store/index";
import deLocale from "./locales/de/additional.json";
import enLocale from "./locales/en/additional.json";

export default {
    component: QueryDistricts,
    store: QueryDistrictsStore,
    locales: {
        de: deLocale,
        en: enLocale
    }
};
