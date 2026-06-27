import AccessibilityAnalysis from "./components/AccessibilityAnalysis.vue";
import AccessibilityAnalysisStore from "./store/index";
import deLocale from "./locales/de/additional.json";
import enLocale from "./locales/en/additional.json";

export default {
    component: AccessibilityAnalysis,
    store: AccessibilityAnalysisStore,
    locales: {
        de: deLocale,
        en: enLocale
    }
};
