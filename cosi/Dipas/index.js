import Dipas from "./components/Dipas.vue";
import DipasStore from "./store/index";
import deLocale from "./locales/de/additional.json";
import enLocale from "./locales/en/additional.json";

export default {
    component: Dipas,
    store: DipasStore,
    locales: {
        de: deLocale,
        en: enLocale
    }
};
