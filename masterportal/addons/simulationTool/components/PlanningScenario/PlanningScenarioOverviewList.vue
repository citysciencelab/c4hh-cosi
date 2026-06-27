<script>
import IconButton from "../../../../src/shared/modules/buttons/components/IconButton.vue";
import layerCollection from "../../../../src/core/layers/js/layerCollection.js";
import layerFactory from "../../../../src/core/layers/js/layerFactory.js";
import {mapActions, mapGetters, mapMutations} from "vuex";

export default {
    name: "PlanningScenarioOverviewList",
    components: {
        IconButton
    },
    emits: ["download"],
    computed: {
        ...mapGetters("Modules/SimulationTool", ["currentPlanningScenarioId", "planningScenarios"]),
        /**
         * Returns the list of planning scenarios sorted by name.
         * @returns {Object[]} Sorted list of planning scenarios.
         */
        sortedPlanningScenarios () {
            return this.planningScenarios ? [...this.planningScenarios].sort((a, b) => a.name.localeCompare(b.name)) : [];
        },

        /**
         * Gets the currently selected planning scenario.
         * @return {Object} The current planning scenario.
         */
        planningScenario () {
            return this.planningScenarios?.find(scenario => scenario.id === this.currentPlanningScenarioId);
        }
    },
    mounted () {
        if (!this.planningScenario) {
            return;
        }
        this.setCurrentPlanningScenarioId("");
        this.getLayer().getLayerSource().clear();
    },
    methods: {
        ...mapActions("Modules/SimulationTool", ["updateFeatures", "zoomToFeature"]),
        ...mapMutations("Modules/SimulationTool", [
            "setCurrentPlanningComponent",
            "setCurrentPlanningScenarioId",
            "setMode",
            "setPlanningScenarios",
            "setPreviousComponentOfSimulation"
        ]),

        /**
         * Creates a layer if it does not yet exist and returns it.
         * @returns {Object} A VECTORBASE Layer
         */
        getLayer () {
            if (typeof layerCollection.getLayerById("planning-scenario") !== "undefined") {
                return layerCollection.getLayerById("planning-scenario");
            }
            const layer = layerFactory.createLayer({
                typ: "VECTORBASE",
                id: "planning-scenario",
                name: "planning-scenario",
                alwaysOnTop: true
            });

            layerCollection.addLayer(layer);
            return layer;
        },

        /**
         * Opens the landuse component and sets the id of the planning scenario to be edited.
         * @param {String} id The id of the planning scenario.
         * @returns {void}
         */
        openLanduseById (id) {
            this.setCurrentPlanningScenarioId(id);
            this.setCurrentPlanningComponent("landuse");
        },

        /**
         * Opens the simulation parameter component.
         * @param {String} id The id of the planning scenario.
         * @returns {void}
         */
        openSimulationParameter (id) {
            this.setCurrentPlanningScenarioId(id);
            this.setPreviousComponentOfSimulation("planningScenario");
            this.setMode("simulationParameter");
        },

        /**
         * Removes a scenario by the passed id from the list of scenarios.
         * @param {Object[]} scenarios - The current list of scenarios.
         * @param {String} id - The id of the scenario to remove.
         * @returns {void}
         */
        removeScenarioById (scenarios, id) {
            const filteredScenarios = scenarios.filter(item => item.id !== id);

            this.setPlanningScenarios(filteredScenarios);
        },

        /**
         * Toggle the planning scenario depending on given id.
         * @param {String} id The id of the planning scenario.
         * @returns {void}
         */
        toggleList (id) {
            this.getLayer().getLayerSource().clear();
            this.setCurrentPlanningScenarioId(id);
            if (this.planningScenario?.scenarioFeature) {
                this.updateFeatures();
                this.zoomToFeature();
            }
        }
    }
};

</script>
<template>
    <div class="list-group list-group-flush mt-4">
        <div
            v-for="scenario in sortedPlanningScenarios"
            :key="scenario.id"
            role="button"
            tabindex="0"
            class="list-group-item list-group-item-action"
            :class="{selected: scenario.id === currentPlanningScenarioId}"
            @click="toggleList(scenario.id)"
            @keydown="toggleList(scenario.id)"
        >
            <div class="d-flex justify-content-between align-items-center">
                <span class="d-flex">{{ scenario.name }}</span>
                <div class="d-flex">
                    <IconButton
                        :class-array="['btn-light', 'me-2']"
                        :icon="'bi-pencil-square'"
                        :aria="$t('additional:modules.tools.simulationTool.simulationSetParams')"
                        :interaction="() => openSimulationParameter(scenario.id)"
                    />
                    <div class="vr me-2" />
                    <IconButton
                        :class-array="['btn-light', 'me-2']"
                        :icon="'bi-gear'"
                        :aria="$t('additional:modules.tools.simulationTool.planningScenarioEdit')"
                        :interaction="() => openLanduseById(scenario.id)"
                    />
                    <IconButton
                        :aria="$t('additional:modules.tools.simulationTool.planningScenarioDownload')"
                        :class-array="['btn-light', 'me-2']"
                        :icon="'bi-download'"
                        :interaction="() => $emit('download', [scenario], scenario.name)"
                    />
                    <IconButton
                        :aria="$t('additional:modules.tools.simulationTool.planningScenarioDelete')"
                        :class-array="['btn-light']"
                        :icon="'bi-trash'"
                        :interaction="() => removeScenarioById(planningScenarios, scenario.id)"
                    />
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped lang="scss">

.list-group-item:hover {
    cursor: pointer;
}

.selected {
    background-color: $light_blue
}
</style>
