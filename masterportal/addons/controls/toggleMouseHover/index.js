import ToggleMouseHoverComponent from "./components/ToggleMouseHover.vue";
import ToggleMouseHoverStore from "./store/indexToggleMouseHover.js";
import deLocale from "./locales/de/additional.json";
import enLocale from "./locales/en/additional.json";

export default {
    component: ToggleMouseHoverComponent,
    store: ToggleMouseHoverStore,
    locales: {
        de: deLocale,
        en: enLocale
    }
};
