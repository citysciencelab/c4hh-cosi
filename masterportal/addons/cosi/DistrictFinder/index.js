import DistrictFinder from "./components/DistrictFinder.vue";
import DistrictFinderStore from "./store/indexDistrictFinder";
import deLocale from "./locales/de/additional.json";
import enLocale from "./locales/en/additional.json";

export default {
    component: DistrictFinder,
    store: DistrictFinderStore,
    locales: {
        de: deLocale,
        en: enLocale
    }
};
