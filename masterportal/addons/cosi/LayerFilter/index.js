import LayerFilter from "./components/LayerFilter.vue";
import LayerFilterStore from "./store/indexLayerFilter";
import deLocale from "./locales/de/additional.json";
import enLocale from "./locales/en/additional.json";

export default {
    component: LayerFilter,
    store: LayerFilterStore,
    locales: {
        de: deLocale,
        en: enLocale
    }
};
