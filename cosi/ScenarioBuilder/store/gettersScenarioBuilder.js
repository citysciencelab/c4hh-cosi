
import {generateSimpleGetters} from "../../../../src/app-store/utils/generators";
import scenarioBuilderState from "./stateScenarioBuilder";

const getters = {
    ...generateSimpleGetters(scenarioBuilderState),

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
