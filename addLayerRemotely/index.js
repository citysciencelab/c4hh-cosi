import addLayerRemotelyRadioBridge from "./js/addLayerRemotelyRadioBridge";
import AddLayerRemotelyStore from "./store/indexAddLayerRemotely";
import deLocale from "./locales/de/additional.json";
import enLocale from "./locales/en/additional.json";

export default {
    addLayerRemotelyRadioBridge,
    store: AddLayerRemotelyStore,
    locales: {
        de: deLocale,
        en: enLocale
    }
};
