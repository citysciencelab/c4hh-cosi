import WaterRiskComponent from "./components/WaterRiskCheck.vue";
import WaterRiskStore from "./store/indexWaterRiskCheck.js";
import deLocale from "./locales/de/additional.json";
import enLocale from "./locales/en/additional.json";

export default {
    component: WaterRiskComponent,
    store: WaterRiskStore,
    locales: {
        de: deLocale,
        en: enLocale
    }
};
