import {generateSimpleGetters} from "@shared/js/utils/generators.js";
import state from "./state.js";

const getters = {
    ...generateSimpleGetters(state),
    /**
     * Determines on which menu side the storyPlayer is located.
     * @param {Object} state - The local state of the storyPlayer module
     * @param {Object} getters - The local getters of the storyPlayer module
     * @param {Object} rootState - The root state of the Vuex store
     * @returns {String} "mainMenu", "secondaryMenu" or "" depending on where the tool is located
     */
    storyPlayerMenuSide (___, __, _, rootGetters) {
        let isInMainMenu = false,
            isInSecondaryMenu = false;

        const mainMenu = rootGetters["Menu/mainMenu"],
            secondaryMenu = rootGetters["Menu/secondaryMenu"];

        mainMenu.sections.forEach((section) => {
            isInMainMenu = section.find(m => {
                return m.type === state.type;
            });
        });

        if (isInMainMenu) {
            return "mainMenu";
        }

        secondaryMenu.sections.forEach((section) => {
            isInSecondaryMenu = section.find(m => {
                return m.type === state.type;
            });
        });

        if (isInSecondaryMenu) {
            return "secondaryMenu";
        }

        return "";
    },
    /**
     * Returns the URL params for the storyPlayer so that the currently loaded story
     * can be restored when the shared link is opened in a browser.
     * @param {Object} storyPlayerState - The local state of the storyPlayer module
     * @returns {Object|undefined} URL params object with currentStoryName, or undefined if no story is loaded.
     */
    urlParams (storyPlayerState) {
        if (storyPlayerState.currentStoryName) {
            return {currentStoryName: storyPlayerState.currentStoryName};
        }
        return undefined;
    }
};

export default getters;
