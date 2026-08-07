import component from "./components/WaterStatistics.vue";
import WaterStatisticsStore from "./store/indexWaterStatistics.js";
import deLocale from "./locales/de/additional.json";
import enLocale from "./locales/en/additional.json";

export default {
    component: component,
    store: WaterStatisticsStore,
    locales: {
        de: deLocale,
        en: enLocale
    }
};
