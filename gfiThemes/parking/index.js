import component from "./components/PrivateParking.vue";
import PrivateParkingStore from "./store/indexPrivateParking";
import deLocale from "./locales/de/additional.json";
import enLocale from "./locales/en/additional.json";

export default {
    component: component,
    store: PrivateParkingStore,
    locales: {
        de: deLocale,
        en: enLocale
    }
};
