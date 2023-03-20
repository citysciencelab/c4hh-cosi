import {generateSimpleMutations} from "../../../../src/app-store/utils/generators";
import stateScenarioBuilder from "./stateScenarioBuilder";

const mutations = {
    /**
     * Creates from every state-key a setter.
     * For example, given a state object {key: value}, an object
     * {setKey:   (state, payload) => *   state[key] = payload * }
     * will be returned.
     */
    ...generateSimpleMutations(stateScenarioBuilder),
    /**
     * adds a feature to the scenario
     * @param {Object} state - the Scenario Builder State
     * @param {Object} payload - {feature, layer} to commit
     * @param {Object} payload.feature - feature to commit
     * @param {Object} payload.layer - layer the feature belongs to
     * @returns {void}
     */
    storeScenarioFeature (state, payload) {
        if (!state.scenario.find(item => item.feature === payload.feature && item.layer === payload.layer)) {
            state.scenario.push(payload);
        }
    }
};

export default mutations;
