import ValuationComponent from "./components/ValuationPrint.vue";
import ValuationStore from "./store/indexValuationPrint";
import deLocale from "./locales/de/additional.json";
import enLocale from "./locales/en/additional.json";

export default {
    component: ValuationComponent,
    store: ValuationStore,
    locales: {
        de: deLocale,
        en: enLocale
    }
};
