import {generateSimpleMutations} from "@shared/js/utils/generators.js";
import stateStoryCreator from "./state.js";

const mutations = {
    /**
     * Removes an image Blob and its preview ObjectURL from the store.
     * @param {Object} state - The module state.
     * @param {String} id - The image id.
     * @returns {void}
     */
    removeImageAsset (state, id) {
        const objectURL = state.imageAssetsById[id]?.objectURL;

        URL.revokeObjectURL(objectURL);
        delete state.imageAssetsById[id];
    },

    /**
     * Creates from every state-key a setter.
     * For example, given a state object {key: value}, an object
     * {setKey:   (state, payload) => *   state[key] = payload * }
     * will be returned.
     */
    ...generateSimpleMutations(stateStoryCreator)
};

export default mutations;
