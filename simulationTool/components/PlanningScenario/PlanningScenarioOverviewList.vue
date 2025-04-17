<script>
import IconButton from "../../../../src/shared/modules/buttons/components/IconButton.vue";
import {mapGetters, mapMutations} from "vuex";

export default {
    name: "PlanningScenarioOverviewList",
    components: {
        IconButton
    },
    emits: ["download"],
    computed: {
        ...mapGetters("Modules/SimulationTool", ["planningScenarios"])
    },
    methods: {
        ...mapMutations("Modules/SimulationTool", [
            "setCurrentPlanningComponent",
            "setCurrentPlanningScenarioId",
            "setMode",
            "setPlanningScenarios",
            "setPreviousComponentOfSimulation"
        ]),

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
        }
    }
};

</script>
<template>
    <ul class="list-group list-group-flush mt-4">
        <li
            v-for="scenario in planningScenarios"
            :key="scenario.id"
            class="list-group-item list-group-item-action"
            aria-current="true"
        >
            <div class="d-flex justify-content-between align-items-center">
                <span class="d-flex">{{ scenario.name }}</span>
                <div class="d-flex">
                    <IconButton
                        :class-array="['btn-light', 'me-2']"
                        :icon="'bi-cup-hot'"
                        :aria="$t('additional:modules.tools.simulationTool.simlulationSetParams')"
                        :interaction="() => openSimulationParameter(scenario.id)"
                    />
                    <div class="vr me-2" />
                    <IconButton
                        :class-array="['btn-light', 'me-2']"
                        :icon="'bi-pencil-square'"
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
        </li>
    </ul>
</template>

<style scoped lang="scss">
    .list-group-item:hover {
        cursor:pointer;
    }
</style>
