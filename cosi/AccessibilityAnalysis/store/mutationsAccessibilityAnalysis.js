import {generateSimpleMutations} from "../../../../src/app-store/utils/generators";
import stateVueAddon from "./stateAccessibilityAnalysis";
import Vue from "vue";

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
    async setDataSets (state, payload) {
        state.activeSet = -1;
        await Vue.nextTick();
        state.dataSets = payload;
        state.activeSet = 0;
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
    },
    /**
     * metadata for dataset used in current analysis configuration.
     * @param {object} state of this component
     * @param {string} payload name of this component
     * @returns {void}
     */
    setMetadata: (state, payload) => {
        state.metaData = payload;
<<<<<<< HEAD
    },

    setProgress: (moduleState, payload) => {
        moduleState.progress = payload;
=======
>>>>>>> 39389637 (add new addons_3_0_0 structure-add missing addons)
    }
};

export default mutations;
