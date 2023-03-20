import ColorCodeMapComponent from "./components/ColorCodeMap.vue";
import ColorCodeMapStore from "./store/index";
import deLocale from "./locales/de/additional.json";
import enLocale from "./locales/en/additional.json";

export default {
    component: ColorCodeMapComponent,
    store: ColorCodeMapStore,
    locales: {
        de: deLocale,
        en: enLocale
    }
};
