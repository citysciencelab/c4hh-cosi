import {generateSimpleMutations} from "../../../../src/app-store/utils/generators";
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
    removeDisabledFeatureItem (state, featureItem) {
        state.disabledFeatureItems = state.disabledFeatureItems.filter(item => item !== featureItem);
    }
};

export default mutations;
