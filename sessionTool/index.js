import SessionToolComponent from "./components/SessionTool.vue";
import SessionToolStore from "./store/indexSessionTool";
import deLocale from "./locales/de/additional.json";
import enLocale from "./locales/en/additional.json";

export default {
    component: SessionToolComponent,
    store: SessionToolStore,
    locales: {
        de: deLocale,
        en: enLocale
    }
};
