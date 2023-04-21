import StreetsmartComponent from "./components/StreetSmart.vue";
import StreetsmartStore from "./store/indexStreetSmart";
import deLocale from "./locales/de/additional.json";
import enLocale from "./locales/en/additional.json";

export default {
    component: StreetsmartComponent,
    store: StreetsmartStore,
    locales: {
        de: deLocale,
        en: enLocale
    }
};
