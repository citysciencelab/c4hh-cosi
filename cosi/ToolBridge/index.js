import ToolBridgeComponent from "./components/ToolBridge.vue";
import ToolBridgeStore from "./store/indexToolBridge";
import deLocale from "./locales/de/additional.json";
import enLocale from "./locales/en/additional.json";

export default {
    component: ToolBridgeComponent,
    store: ToolBridgeStore,
    locales: {
        de: deLocale,
        en: enLocale
    }
};
