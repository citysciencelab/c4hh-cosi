import ResetTreeComponent from "./components/ResetTree.vue";
import ResetTreeStore from "./store/index";
import deLocale from "./locales/de/additional.json";
import enLocale from "./locales/en/additional.json";

export default {
    component: ResetTreeComponent,
    store: ResetTreeStore,
    locales: {
        de: deLocale,
        en: enLocale
    }
};
