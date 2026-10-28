import SocialInfraMonitor from "./components/SocialInfraMonitor.vue";
import SocialInfraMonitorStore from "./store/indexSocialInfraMonitor";
import deLocale from "./locales/de/additional.json";
import enLocale from "./locales/en/additional.json";

export default {
    component: SocialInfraMonitor,
    store: SocialInfraMonitorStore,
    locales: {
        de: deLocale,
        en: enLocale
    }
};
