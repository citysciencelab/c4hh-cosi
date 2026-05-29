import component from "./components/StoryManager.vue";
import store from "./store";
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
