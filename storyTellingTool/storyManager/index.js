import component from "./components/StoryManager.vue";
import store from "./store";
import de from "./locales/de/additional.json";
import en from "./locales/en/additional.json";
import creatorDe from "../storyCreator/locales/de/additional.json";
import creatorEn from "../storyCreator/locales/en/additional.json";

export default {
    component,
    store,
    locales: {
        de: {modules: {...de.modules, ...creatorDe.modules}},
        en: {modules: {...en.modules, ...creatorEn.modules}}
    }
};
