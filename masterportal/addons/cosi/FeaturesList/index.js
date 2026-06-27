import FeaturesList from "./components/FeaturesList.vue";
import FeaturesListStore from "./store/indexFeaturesList";
import deLocale from "./locales/de/additional.json";
import enLocale from "./locales/en/additional.json";

export default {
    component: FeaturesList,
    store: FeaturesListStore,
    locales: {
        de: deLocale,
        en: enLocale
    }
};
