import component from "./components/Projects.vue";
import store from "./store/index.js";
import de from "./locales/de/additional.json";
import en from "./locales/en/additional.json";

export default {
    component,
    store,
    locales: {
        de,
        en
    }
};
