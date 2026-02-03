import {generateSimpleMutations} from "../../../src/shared/js/utils/generators.js";
import stateSdpAddon from "./stateSdpDownload.js";

const mutations = {
    /**
     * Creates from every state-key a setter.
     * For example, given a state object {key: value}, an object
     * {setKey:   (state, payload) => *   state[key] = payload * }
     * will be returned.
     */
    ...generateSimpleMutations(stateSdpAddon),

    /**
     * Sets the selectedAreaGeoJson from the selected area by the graphicalSelect snippet
     * @param {Object} state vuex element
     * @param {Object} selectedAreaGeoJson of the selected area by the graphicalSelect snippet
     * @returns {void}
     */
    setSelectedAreaGeoJson: (state, selectedAreaGeoJson) => {
        if (selectedAreaGeoJson) {
            state.graphicalSelectModel.attributes.selectedAreaGeoJson = selectedAreaGeoJson;
        }
    }
};

export default mutations;
