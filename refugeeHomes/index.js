import RefugeesHomesComponent from "./components/RefugeeHomes.vue";
import RefugeesHomesStore from "./store/indexRefugeeHomes";
import deLocale from "./locales/de/additional.json";
import enLocale from "./locales/en/additional.json";

export default {
    component: RefugeesHomesComponent,
    store: RefugeesHomesStore,
    locales: {
        de: deLocale,
        en: enLocale
    }
};
