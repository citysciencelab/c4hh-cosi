import PopulationRequestComponent from "./components/PopulationRequest.vue";
import PopulationRequestStore from "./store/indexPopulationRequest.js";
import deLocale from "./locales/de/additional.json";
import enLocale from "./locales/en/additional.json";

export default {
    component: PopulationRequestComponent,
    store: PopulationRequestStore,
    locales: {
        de: deLocale,
        en: enLocale
    }
};
