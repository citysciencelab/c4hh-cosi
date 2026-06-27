import component from "./components/TrafficCount.vue";
import TrafficCountStore from "./store/indexTrafficCount.js";
import deLocale from "./locales/de/additional.json";
import enLocale from "./locales/en/additional.json";

export default {
    component: component,
    store: TrafficCountStore,
    locales: {
        de: deLocale,
        en: enLocale
    }
};
