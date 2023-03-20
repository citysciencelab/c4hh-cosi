import ResidentialSimulation from "./components/ResidentialSimulation.vue";
import ResidentialSimulationStore from "./store/indexResidentialSimulation";
import deLocale from "./locales/de/additional.json";
import enLocale from "./locales/en/additional.json";

export default {
    component: ResidentialSimulation,
    store: ResidentialSimulationStore,
    locales: {
        de: deLocale,
        en: enLocale
    }
};
