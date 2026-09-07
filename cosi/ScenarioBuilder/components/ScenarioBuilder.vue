<script>
import {addSimulationTag, removeSimulationTag} from "../utils/guideLayer";
import {mapGetters, mapActions, mapMutations} from "vuex";
import ScenarioBuilderManager from "./ScenarioBuilderManager.vue";
import ScenarioBuilderPlanner from "./ScenarioBuilderPlanner.vue";
import ToolInfo from "../../shared/modules/toolInfo/components/ToolInfo.vue";

export default {
    name: "ScenarioBuilder",

    components: {
        ToolInfo,
        ScenarioBuilderManager,
        ScenarioBuilderPlanner
    },

    provide () {
        return {
            addFeatureToScenario: this.addFeatureToScenario,
            removeFeatureFromScenario: this.removeFeatureFromScenario,
            toggleCurrentView: this.toggleCurrentView,
            updateSimulationTag: this.updateSimulationTag
        };
    },

    data () {
        return {
            // The current view of the ScenarioBuilder component. It can be either 'manager' or 'planner'.
            currentView: "manager",
            // The layer that holds the features of the active scenario.
            scenarioLayer: null,
            // The ID of the scenario layer, used for identification and retrieval.
            scenarioLayerId: "active-scenario"
        };
    },

    computed: {
        ...mapGetters("Modules/ScenarioBuilder", ["activeScenarioCard", "guideLayer"])
    },

    watch: {
        activeScenarioCard (newScenarioCard) {
            if (newScenarioCard) {
                this.updateScenarioLayer();
            }
        }
    },

    async created () {
        this.scenarioLayer = await this.getLayerById(this.scenarioLayerId);
        this.scenarioLayer.getLayer().setVisible(true);
        this.scenarioLayer.getLayer().setZIndex(10);
        this.setGuideLayer(await this.createGuideLayer());
    },

    methods: {
        ...mapActions("Modules/ScenarioBuilder", ["createGuideLayer", "getLayerById", "updateScenarioLayer"]),
        ...mapMutations("Modules/ScenarioBuilder", ["setGuideLayer"]),
        ...mapActions("Maps", ["addNewLayerIfNotExists"]),

        /**
         * Adds a feature to the scenario layer and tags it for simulation.
         * @param {Feature} feature - The feature to be added to the scenario.
         */
        addFeatureToScenario (feature) {
            this.scenarioLayer.getLayerSource().addFeature(feature);
            addSimulationTag(feature, this.guideLayer);
        },

        /**
         * Removes a feature from the scenario layer and un-tags it from the guide layer.
         * @param {Feature} feature - The feature to be removed from the scenario.
         */
        removeFeatureFromScenario (feature) {
            this.scenarioLayer.getLayerSource().removeFeature(feature);
            removeSimulationTag(feature, this.guideLayer);
        },

        /**
         * Toggles the current view between 'manager' and 'planner'.
         * @param {string} view - The view to switch to.
         * @returns {void}
         */
        toggleCurrentView (view) {
            this.currentView = view;
        },

        /**
         * Updates the simulation tag for a given feature by first removing
         * any existing simulation tag and then adding a new one.
         * @param {Feature} feature - The feature to update the simulation tag for.
         */
        updateSimulationTag (feature) {
            removeSimulationTag(feature, this.guideLayer);
            addSimulationTag(feature, this.guideLayer);
        }
    }
};
</script>

<template lang="html">
    <div id="scenario-builder">
        <ToolInfo
            :locale="currentLocale"
            :summary="$t('additional:modules.tools.cosi.scenarioBuilder.description')"
            :url="{}"
        />
        <ScenarioBuilderManager
            v-if="currentView === 'manager'"
        />
        <ScenarioBuilderPlanner
            v-else-if="currentView === 'planner'"
            :scenario-layer-id="scenarioLayerId"
        />
    </div>
</template>
