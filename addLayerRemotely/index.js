import AddLayerRemotelyComponent from "./components/AddLayerRemotely.vue";
import AddLayerRemotelyStore from "./store/index.js";
import deLocale from "./locales/de/additional.json";
import enLocale from "./locales/en/additional.json";

export default {
    component: AddLayerRemotelyComponent,
    store: AddLayerRemotelyStore,
    locales: {
        de: deLocale,
        en: enLocale
    }
};
