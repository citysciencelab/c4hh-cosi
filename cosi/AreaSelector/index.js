import AreaSelector from "./components/AreaSelector.vue";
import AreaSelectorStore from "./store/indexAreaSelector";
import deLocale from "./locales/de/additional.json";
import enLocale from "./locales/en/additional.json";

export default {
    component: AreaSelector,
    store: AreaSelectorStore,
    locales: {
        de: deLocale,
        en: enLocale
    }
};
