import FloodRiskManagementComponent from "./components/FloodRiskManagement.vue";
import FloodRiskManagementStore from "./store/indexFloodRiskManagement.js";
import deLocale from "./locales/de/additional.json";
import enLocale from "./locales/en/additional.json";

export default {
    component: FloodRiskManagementComponent,
    store: FloodRiskManagementStore,
    locales: {
        de: deLocale,
        en: enLocale
    }
};
