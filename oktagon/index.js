import OktagonComponent from "./components/OktagonComponent.vue";
import OktagonStore from "./store/indexOktagon.js";
import deLocale from "./locales/de/additional.json";
import enLocale from "./locales/en/additional.json";

export default {
    component: OktagonComponent,
    store: OktagonStore,
    locales: {
        de: deLocale,
        en: enLocale
    }
};
