import {generateSimpleMutations} from "../../../../src/app-store/utils/generators";
import stateVueAddon from "./stateQueryDistricts";

/**
 * Adds a new empty dataset
 * @param {*} state of this component
 * @returns {void}
 */
function _addSet (state) {
    const createSet = {
        inputs: {
            selectedDistrict: "",
            layerFilterModels: [],
            selectedLayer: "",
            resultTableHeaders: []
        },
        results: []
    };

    state.dataSets.push(createSet);
    state.activeSet = state.dataSets.length - 1;
}

const mutations = {
    /**
     * Creates from every state-key a setter.
     * For example, given a state object {key: value}, an object
     * {setKey:   (state, payload) => *   state[key] = payload * }
     * will be returned.
     */
    ...generateSimpleMutations(stateVueAddon),

    /**
     * Sets the dataSets object and resets the active index to 0
     * @param {Object} state of this component
     * @param {Object[]} payload the dataSets object
     * @returns {void}
     */
    setDataSets (state, payload) {
        if (payload.length && payload[payload.length - 1].inputs?.layerFilterModels?.length > 0) {
            state.dataSets = payload;
            _addSet(state);
        }
    },

    /**
     * Adds a new empty dataset
     * @param {*} state of this component
     * @returns {void}
     */
    addSet (state) {
        _addSet(state);
    },

    /**
     * If name from config.json starts with "translate#", the corrected key is set to name here.
     * @param {object} state of this component
     * @param {string} payload name of this component
     * @returns {void}
     */
    applyTranslationKey: (state, payload) => {
        if (payload && payload.indexOf("translate#") > -1) {
            state.name = payload.substring("translate#".length);
        }
    }
};

export default mutations;
