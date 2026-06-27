import TacticalMarkComponent from "./components/TacticalMark.vue";
import TacticalMarkStore from "./store/indexTacticalMark";
import deLocale from "./locales/de/additional.json";
import enLocale from "./locales/en/additional.json";

export default {
    component: TacticalMarkComponent,
    store: TacticalMarkStore,
    locales: {
        de: deLocale,
        en: enLocale
    }
};
