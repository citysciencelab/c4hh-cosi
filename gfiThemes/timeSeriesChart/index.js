import component from "./components/TimeSeriesChart.vue";
import TimeSeriesChartStore from "./store/indexTimeSeriesChart.js";
import deLocale from "./locales/de/additional.json";
import enLocale from "./locales/en/additional.json";

export default {
    component: component,
    store: TimeSeriesChartStore,
    locales: {
        de: deLocale,
        en: enLocale
    }
};
