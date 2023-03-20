import ChartGeneratorComponent from "./components/ChartGenerator.vue";
import ChartGeneratorStore from "./store/index";
import deLocale from "./locales/de/additional.json";
import enLocale from "./locales/en/additional.json";

export default {
    component: ChartGeneratorComponent,
    store: ChartGeneratorStore,
    locales: {
        de: deLocale,
        en: enLocale
    }
};
