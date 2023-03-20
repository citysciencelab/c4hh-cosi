import {generateSimpleMutations} from "../../../../src_3_0_0/shared/js/utils/generators";
import stateSdpAddon from "./stateSdpDownload";

const mutations = {
    /**
     * Creates from every state-key a setter.
     * For example, given a state object {key: value}, an object
     * {setKey:   (state, payload) => *   state[key] = payload * }
     * will be returned.
     */
    ...generateSimpleMutations(stateSdpAddon),

    /**
     * If name from config.json starts with "translate#", the corrected key is set to name here.
     * @param {Object} state vuex element
     * @param {String} payload name of this component
     * @returns {void}
     */
    applyTranslationKey: (state, payload) => {
        if (payload && payload.indexOf("translate#") > -1) {
            state.name = payload.substring("translate#".length);
        }
    },
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
