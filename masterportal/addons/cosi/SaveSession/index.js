import SaveSession from "./components/SaveSession.vue";
import SaveSessionStore from "./store/indexSaveSession";
import deLocale from "./locales/de/additional.json";
import enLocale from "./locales/en/additional.json";

export default {
    component: SaveSession,
    store: SaveSessionStore,
    locales: {
        de: deLocale,
        en: enLocale
    }
};
