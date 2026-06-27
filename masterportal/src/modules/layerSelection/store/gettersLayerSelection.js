import {generateSimpleGetters} from "@shared/js/utils/generators.js";
import stateAppStore from "./stateLayerSelection.js";

const getters = {
    ...generateSimpleGetters(stateAppStore),
    /**
     * Provides state for urlParams, returns only lastFolderNames.
     * @param {Object} state state of the app-store.
     * @returns {Object} state for urlParams
     */
    urlParams: state => {
        return {
            lastFolderNames: state.lastFolderNames
        };
    }
};

export default getters;
