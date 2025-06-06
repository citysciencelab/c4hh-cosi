<script>
import FlatButton from "../../../../src/shared/modules/buttons/components/FlatButton.vue";
import isObject from "../../../../src/shared/js/utils/isObject";
import layerCollection from "../../../../src/core/layers/js/layerCollection";
import {mapGetters, mapMutations} from "vuex";
import SectionHeader from "../SectionHeader.vue";

export default {
    name: "SimulationList",
    components: {
        FlatButton,
        SectionHeader
    },
    data () {
        return {};
    },
    computed: {
        ...mapGetters("Modules/SimulationTool", ["planningScenarios"]),

        /**
         * Returns a list of all conducted simulations in all planning scenarios.
         * @returns {Object[]} - List of simulations with simulation name and scenario name.
         */
        simulationList () {
            const list = [];

            this.planningScenarios?.forEach(scenario => {
                if (!isObject(scenario.simulations)) {
                    return;
                }
                Object.entries(scenario.simulations).forEach(([simulationId, simulation]) => {
                    const listEntry = {
                        scenarioName: scenario.name,
                        scenarioId: scenario.id,
                        simulationId: simulationId,
                        simulationName: simulation.name
                    };

                    list.push(listEntry);
                });
            });

            return list;
        }
    },
    mounted () {
        if (typeof layerCollection.getLayerById("planning-scenario") !== "undefined") {
            layerCollection.getLayerById("planning-scenario").getLayerSource().clear();
        }
    },
    methods: {
        ...mapMutations("Modules/SimulationTool", [
            "setCurrentPlanningComponent",
            "setCurrentPlanningScenarioId",
            "setMode",
            "setSimulationIdForResults"
        ]),

        /**
         * Opens create planning scenario component.
         * @returns {void}
         */
        openCreatePlanningScenario () {
            this.setMode("planningScenario");
            this.setCurrentPlanningComponent("create");
        },

        /**
         * Opens simulation results component.
         * @param {String} simulationId - Id of the simulation to open.
         * @param {String} scenarioId - ID of the scenario.
         * @returns {void}
         */
        openSimulation (simulationId, scenarioId) {
            this.setMode("simulationResults");
            this.setSimulationIdForResults(simulationId);
            this.setCurrentPlanningScenarioId(scenarioId);
        }
    }
};
</script>

<template>
    <div class="vh-100 overflow-y-auto">
        <SectionHeader
            :title="$t('additional:modules.tools.simulationTool.simulationList')"
        />
        <table v-if="simulationList.length">
            <thead>
                <tr>
                    <th>
                        {{ $t('additional:modules.tools.simulationTool.simulationName') }}
                    </th>
                    <th>
                        {{ $t('additional:modules.tools.simulationTool.planningScenario') }}
                    </th>
                </tr>
            </thead>
            <tbody>
                <tr
                    v-for="simulationEntry in simulationList"
                    :key="simulationEntry.simulationId"
                >
                    <td>
                        <a
                            role="button"
                            tabindex="0"
                            @click="() => openSimulation(simulationEntry.simulationId, simulationEntry.scenarioId)"
                            @keypress="() => openSimulation(simulationEntry.simulationId, simulationEntry.scenarioId)"
                        >
                            {{ simulationEntry.simulationName }}
                        </a>
                    </td>
                    <td>
                        {{ simulationEntry.scenarioName }}
                    </td>
                </tr>
            </tbody>
        </table>
        <div
            v-else
            class="alert alert-primary"
        >
            {{ $t('additional:modules.tools.simulationTool.noJobs') }}
        </div>
        <div class="row d-flex">
            <div class="col col-6 create-scenario">
                <FlatButton
                    class="pe-2 mt-4"
                    :aria-label="$t('additional:modules.tools.simulationTool.planningScenarioCreate')"
                    :icon="'bi bi-pencil-square'"
                    :interaction="() => openCreatePlanningScenario()"
                    :text="$t('additional:modules.tools.simulationTool.planningScenarioCreate')"
                />
            </div>
        </div>
    </div>
</template>

<style lang="scss" scoped>
@import "~variables";

</style>
