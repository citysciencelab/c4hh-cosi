import ObliqueViewerComponent from "./components/VcOblique.vue";
import ObliqueViewerStore from "./store/indexVcOblique.js";
import deLocale from "./locales/de/additional.json";
import enLocale from "./locales/en/additional.json";

export default {
    component: ObliqueViewerComponent,
    store: ObliqueViewerStore,
    locales: {
        de: deLocale,
        en: enLocale
    }
};
