import {generateSimpleMutations} from "@shared/js/utils/generators.js";
import stateLayerFilter from "./stateLayerFilter";

const mutations = {
    ...generateSimpleMutations(stateLayerFilter),

    /**
     * Sets or replaces the filter entry of one layer.
     * @param {Object} state The state.
     * @param {{layerId: String, entry: Object}} payload Layer id and entry.
     * @returns {void}
     */
    setFilterEntry (state, {layerId, entry}) {
        state.filters = {...state.filters, [layerId]: {...state.filters[layerId], ...entry}};
    },

    /**
     * Removes the filter entry of one layer.
     * @param {Object} state The state.
     * @param {String} layerId Layer id.
     * @returns {void}
     */
    removeFilterEntry (state, layerId) {
        const filters = {...state.filters};

        delete filters[layerId];
        state.filters = filters;
    }
};

export default mutations;
