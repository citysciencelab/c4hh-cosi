import ScenarioBuilder from "./components/ScenarioBuilder.vue";
import ScenarioBuilderStore from "./store/indexScenarioBuilder";
import deLocale from "./locales/de/additional.json";
import enLocale from "./locales/en/additional.json";

export default {
    component: ScenarioBuilder,
    store: ScenarioBuilderStore,
    locales: {
        de: deLocale,
        en: enLocale
    }
};
