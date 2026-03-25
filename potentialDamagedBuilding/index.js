import PotentialDamagedBuildingComponent from "./components/PotentialDamagedBuilding.vue";
import PotentialDamagedBuildingStore from "./store/indexPotentialDamagedBuilding.js";
import deLocale from "./locales/de/additional.json";
import enLocale from "./locales/en/additional.json";

export default {
    component: PotentialDamagedBuildingComponent,
    store: PotentialDamagedBuildingStore,
    locales: {
        de: deLocale,
        en: enLocale
    }
};
