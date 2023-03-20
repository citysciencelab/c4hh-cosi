import CosiFileImportComponent from "./components/CosiFileImport.vue";
import CosiFileImportStore from "./store/indexCosiFileImport";
import deLocale from "./locales/de/additional.json";
import enLocale from "./locales/en/additional.json";

export default {
    component: CosiFileImportComponent,
    store: CosiFileImportStore,
    locales: {
        de: deLocale,
        en: enLocale
    }
};
