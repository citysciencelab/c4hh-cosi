import deLocale from "./locales/de/additional.json";
import enLocale from "./locales/en/additional.json";
import SessionTool from "./components/SessionTool.vue";
import SessiontToolStore from "./store/indexSessionTool.js";

export default {
    component: SessionTool,
    store: SessiontToolStore,
    locales: {
        de: deLocale,
        en: enLocale
    }
};
