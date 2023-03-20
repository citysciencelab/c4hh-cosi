import {generateSimpleMutations} from "../../../src/app-store/utils/generators";
import refugeeHomesState from "./stateRefugeeHomes";

const mutations = {
    /**
     * Creates from every state-key a setter.
     * For example, given a state object {key: value}, an object
     * {setKey:   (state, payload) => *   state[key] = payload * }
     * will be returned.
     */
    ...generateSimpleMutations(refugeeHomesState),

    /**
     * Add parsed features from WFS to the feature array.
     * @param {object} state of this component
     * @param {string} feature feature of the wfs response
     * @returns {void}
     */
    addFeature: (state, feature) => {
        if (feature) {
            state.features.push(feature);
        }

    },
    /**
     * Add parsed and sorted features from WFS to the feature array.
     * @param {object} state of this component
     * @param {string} feature sorted feature of the wfs response
     * @returns {void}
     */
    addFilteredFeature: (state, feature) => {
        if (feature) {
            state.filteredFeatures.push(feature);
        }
    }

};

export default mutations;

