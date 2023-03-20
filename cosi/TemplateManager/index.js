import TemplateManager from "./components/TemplateManager.vue";
import TemplateManagerStore from "./store/indexTemplateManager";
import deLocale from "./locales/de/additional.json";
import enLocale from "./locales/en/additional.json";

export default {
    component: TemplateManager,
    store: TemplateManagerStore,
    locales: {
        de: deLocale,
        en: enLocale
    }
};
