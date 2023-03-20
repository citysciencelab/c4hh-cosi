import SelectionManagerComponent from "./components/SelectionManager.vue";
import SelectionManagerStore from "./store/index";
import deLocale from "./locales/de/additional.json";
import enLocale from "./locales/en/additional.json";

export default {
    component: SelectionManagerComponent,
    store: SelectionManagerStore,
    locales: {
        de: deLocale,
        en: enLocale
    }
};
