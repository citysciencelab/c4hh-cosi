import DistrictSelector from "./components/DistrictSelector.vue";
import DistrictSelectorStore from "./store/indexDistrictSelector";
import deLocale from "./locales/de/additional.json";
import enLocale from "./locales/en/additional.json";

export default {
    component: DistrictSelector,
    store: DistrictSelectorStore,
    locales: {
        de: deLocale,
        en: enLocale
    }
};
