import CalculateRatioComponent from "./components/CalculateRatio.vue";
import CalculateRatioStore from "./store/index";
import deLocale from "./locales/de/additional.json";
import enLocale from "./locales/en/additional.json";

export default {
    component: CalculateRatioComponent,
    store: CalculateRatioStore,
    locales: {
        de: deLocale,
        en: enLocale
    }
};
