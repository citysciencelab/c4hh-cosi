import {generateSimpleGetters} from "@shared/js/utils/generators";
import scenarioBuilderState from "./stateScenarioBuilder";

const getters = {
    ...generateSimpleGetters(scenarioBuilderState),

    /**
     * Returns the currently active scenario card.
     * @param {Object} state - Vuex state of ScenarioBuilder module.
     * @returns {Object|undefined} Active scenario card or undefined.
     */
    activeScenarioCard (state) {
        return state.scenarioCards.find(card => card.status === "active");
    },

    /**
     * Returns the currently active object card within the active scenario card.
     * @param {Object} state - Vuex state of ScenarioBuilder module.
     * @param {Object} getters - Vuex getters of ScenarioBuilder module.
     * @returns {Object|undefined} Active object card or undefined.
     */
    activeObjectCard (state, {activeScenarioCard}) {
        return activeScenarioCard?.objects.find(card => card.status === "active");
    },

    activeSimulatedFeatures (state, {activeScenario}) {
        return activeScenario?.getSimulatedFeatures();
    },

    activeModifiedFeatures (state, {activeScenario}) {
        return activeScenario?.getModifiedFeatures();
    },

    activeModifiedFeaturesCount (state, {activeScenario}) {
        return activeScenario?.getModifiedFeatures().filter(f => f.feature.get("isModified"));
    },

    scenarioUpdated (state, {activeScenario}) {
        return activeScenario?.getUpdated();
    }
};


export default getters;
