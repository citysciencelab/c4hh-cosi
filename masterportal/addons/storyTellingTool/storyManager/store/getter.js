import {generateSimpleGetters} from "@shared/js/utils/generators";
import stateStoryManager from "./state.js";

const getters = {
    ...generateSimpleGetters(stateStoryManager),
    /**
     * Returns the menu side where storyManager is currently configured.
     * @param {Object} ___ - local state (unused)
     * @param {Object} __ - local getters (unused)
     * @param {Object} _ - root state (unused)
     * @param {Object} rootGetters - root getters
     * @returns {"mainMenu"|"secondaryMenu"|""} active menu side
     */
    menuSide (___, __, _, rootGetters) {
        const mainMenuSections = rootGetters?.["Menu/mainMenu"]?.sections,
            isStoryManagerInMain = Array.isArray(mainMenuSections)
                && mainMenuSections.flat(Infinity).some(entry => entry?.type === "storyManager");

        if (isStoryManagerInMain) {
            return "mainMenu";
        }
        return "secondaryMenu";
    }
};

export default getters;
