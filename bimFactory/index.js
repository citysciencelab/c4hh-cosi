import BimFactoryComponent from "./components/BimFactory.vue";
import BimFactoryStore from "./store/indexBimFactory.js";
import deLocale from "./locales/de/additional.json";
import enLocale from "./locales/en/additional.json";

export default {
    component: BimFactoryComponent,
    store: BimFactoryStore,
    locales: {
        de: deLocale,
        en: enLocale
    }
};
