import MpAddonComponent from "./components/MpAddon.vue";
import MpAddonStore from "./store/indexMpAddon";
import deLocale from "./locales/de/additional.json";
import enLocale from "./locales/en/additional.json";
// MP-12: side-effect import — mounts the floating map comment control onto the
// Masterportal container so it lives on the map independent of the addon menu.
import "./js/mountMapCommentControl.js";

export default {
    component: MpAddonComponent,
    store: MpAddonStore,
    locales: {
        de: deLocale,
        en: enLocale
    }
};
