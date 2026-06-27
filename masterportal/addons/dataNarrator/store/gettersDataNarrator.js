import {generateSimpleGetters} from "@shared/js/utils/generators.js";
import state from "./stateDataNarrator.js";

const getters = {
    ...generateSimpleGetters(state),
    /**
     * Determines on which menu side the dataNarrator is located.
     * @param {Object} state - The local state of the dataNarrator module
     * @param {Object} getters - The local getters of the dataNarrator module
     * @param {Object} rootState - The root state of the Vuex store
     * @returns {String} "mainMenu", "secondaryMenu" or "" depending on where the tool is located
     */
    dataNarratorMenuSide (___, __, _, rootGetters) {
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
    }
};

export default getters;
