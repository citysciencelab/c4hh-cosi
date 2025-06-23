import component from "./components/CombinedGfi.vue";
import CombinedGfiStore from "./store/indexCombinedGfi.js";
import deLocale from "./locales/de/additional.json";
import enLocale from "./locales/en/additional.json";

export default {
    component: component,
    store: CombinedGfiStore,
    locales: {
        de: deLocale,
        en: enLocale
    }
};
