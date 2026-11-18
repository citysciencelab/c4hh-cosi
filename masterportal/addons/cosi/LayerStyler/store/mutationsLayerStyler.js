import {generateSimpleMutations} from "@shared/js/utils/generators.js";
import stateLayerStyler from "./stateLayerStyler";

const mutations = {
    ...generateSimpleMutations(stateLayerStyler),

    /**
     * Sets or replaces the style entry of one layer.
     * @param {Object} state The state.
     * @param {{layerId: String, entry: Object}} payload Layer id and entry.
     * @returns {void}
     */
    setStyleEntry (state, {layerId, entry}) {
        state.styles = {...state.styles, [layerId]: {...state.styles[layerId], ...entry}};
    },

    /**
     * Removes the style entry of one layer.
     * @param {Object} state The state.
     * @param {String} layerId Layer id.
     * @returns {void}
     */
    removeStyleEntry (state, layerId) {
        const styles = {...state.styles};

        delete styles[layerId];
        state.styles = styles;
    }
};

export default mutations;
