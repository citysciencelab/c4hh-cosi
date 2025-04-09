import BimFabrikHHComponent from "./components/BimFabrikHH.vue";
import BimFabrikHHStore from "./store/indexBimFabrikHH";
import deLocale from "./locales/de/additional.json";
import enLocale from "./locales/en/additional.json";

export default {
    component: BimFabrikHHComponent,
    store: BimFabrikHHStore,
    locales: {
        de: deLocale,
        en: enLocale
    }
};
