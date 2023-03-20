import store from "../../../../src/app-store";
import Vue from "vue";
import {getLayerSource} from "../../utils/layer/getLayerSource";

/**
 * rerenders the feature if necessary
 * @param {ScenarioFeature} scenarioFeature - the scenario feature
 * @returns {void}
 */
export default async function (scenarioFeature) {
    await Vue.nextTick();

    if (
        !getLayerSource(scenarioFeature.layer).hasFeature(scenarioFeature.feature) &&
        // eslint-disable-next-line new-cap
        store.getters["Tools/FeaturesList/isFeatureActive"](scenarioFeature.feature) &&
        scenarioFeature.scenario.isActive
    ) {
        getLayerSource(scenarioFeature.layer).addFeature(scenarioFeature.feature);
    }
}
