import OktagonComponent from "./components/OktagonKartenportal.vue";
import OktagonStore from "./store/indexOktagonKartenportal";
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
