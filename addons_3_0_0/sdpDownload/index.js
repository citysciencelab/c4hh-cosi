import SdpAddonComponent from "./components/SdpDownload.vue";
import SdpAddonStore from "./store/index";
import deLocale from "./locales/de/additional.json";
import enLocale from "./locales/en/additional.json";

export default {
    component: SdpAddonComponent,
    store: SdpAddonStore,
    locales: {
        de: deLocale,
        en: enLocale
    }
};
