import HochWasserPrintComponent from "./components/HochWasserPrint.vue";
import HochWasserPrintStore from "./store/indexHochWasserPrint";
import deLocale from "./locales/de/additional.json";
import enLocale from "./locales/en/additional.json";

export default {
    component: HochWasserPrintComponent,
    store: HochWasserPrintStore,
    locales: {
        de: deLocale,
        en: enLocale
    }
};
