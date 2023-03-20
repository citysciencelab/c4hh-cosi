import QuickResponseCodeComponent from "./components/QuickResponseCode.vue";
import QuickResponseCodeStore from "./store/indexQuickResponseCode";
import deLocale from "./locales/de/additional.json";
import enLocale from "./locales/en/additional.json";

export default {
    component: QuickResponseCodeComponent,
    store: QuickResponseCodeStore,
    locales: {
        de: deLocale,
        en: enLocale
    }
};
