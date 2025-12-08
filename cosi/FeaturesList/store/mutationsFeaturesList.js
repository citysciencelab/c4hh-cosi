import {generateSimpleMutations} from "@shared/js/utils/generators";
import stateFeaturesList from "./stateFeaturesList";

const mutations = {
    /**
     * Creates from every state-key a setter.
     * For example, given a state object {key: value}, an object
     * {setKey:   (state, payload) => *   state[key] = payload * }
     * will be returned.
     */
    ...generateSimpleMutations(stateFeaturesList),
    addDisabledFeatureItem (state, featureItem) {
        state.disabledFeatureItems.push(featureItem);
    },

    /**
     * @param {Object} state The vuex state
     * @param {...Object} items The items to append to the features list
     */
    appendFeaturesListItems (state, ...items) {
        state.featuresListItems.push(...items);
    },
    removeDisabledFeatureItem (state, featureItem) {
        state.disabledFeatureItems = state.disabledFeatureItems.filter(item => item !== featureItem);
    }
};

export default mutations;
