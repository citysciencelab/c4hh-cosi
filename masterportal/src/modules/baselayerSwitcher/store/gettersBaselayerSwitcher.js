import {generateSimpleGetters} from "@shared/js/utils/generators.js";
import stateBaselayerSwitcher from "./stateBaselayerSwitcher.js";

const getters = {
    ...generateSimpleGetters(stateBaselayerSwitcher),

    /**
     * Provides state for filteredBaseLayers.
     * @param {Object} state state of the app-store.
     * @returns {Object} state for filteredBaseLayers
     */
    filteredBaseLayers: state => {
        if (!state.visibleBaselayerIds.length) {
            return state.baselayers;
        }
        const filteredLayers = state.baselayers.filter(
            l => state.visibleBaselayerIds.includes(l.id)
        );

        if (filteredLayers.length === 0) {
            console.warn(
                `visibleBaselayerIds is set to "${state.visibleBaselayerIds}" but no baselayers match the filter. Please check if the provided IDs are correct.`
            );
        }

        return filteredLayers;
    }
};

export default getters;
