<script>
import FlatButton from "../../../../src/shared/modules/buttons/components/FlatButton.vue";
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
         * Returns a list of all jobs in all planning scenarios.
         * @returns {Object[]} - List of jobs with jobID and scenarioName.
         */
        jobList () {
            const list = [];

            this.planningScenarios?.forEach(scenario => {
                for (const jobID in scenario.jobs) {
                    const listEntry = {
                        jobID: jobID,
                        scenarioName: scenario.name,
                        scenarioId: scenario.id
                    };

                    list.push(listEntry);
                }
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
            "setCurrentJobID",
            "setCurrentPlanningComponent",
            "setCurrentPlanningScenarioId",
            "setMode"
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
         * @param {String} jobID - ID of the job to open.
         * @param {String} scenarioId - ID of the scenario.
         * @returns {void}
         */
        openJob (jobID, scenarioId) {
            this.setMode("simulationResults");
            this.setCurrentJobID(jobID);
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
        <table v-if="jobList.length">
            <thead>
                <tr>
                    <th>
                        JobID
                    </th>
                    <th>
                        Planungsszenario
                    </th>
                </tr>
            </thead>
            <tbody>
                <tr
                    v-for="jobEntry in jobList"
                    :key="jobEntry.jobID"
                >
                    <td>
                        <a
                            role="button"
                            tabindex="0"
                            @click="() => openJob(jobEntry.jobID, jobEntry.scenarioId)"
                            @keypress="() => openJob(jobEntry.jobID, jobEntry.scenarioId)"
                        >
                            {{ jobEntry.jobID }}
                        </a>
                    </td>
                    <td>
                        {{ jobEntry.scenarioName }}
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
