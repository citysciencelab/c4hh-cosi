import LayerStyler from "./components/LayerStyler.vue";
import LayerStylerStore from "./store/indexLayerStyler";
import deLocale from "./locales/de/additional.json";
import enLocale from "./locales/en/additional.json";

export default {
    component: LayerStyler,
    store: LayerStylerStore,
    locales: {
        de: deLocale,
        en: enLocale
    }
};
