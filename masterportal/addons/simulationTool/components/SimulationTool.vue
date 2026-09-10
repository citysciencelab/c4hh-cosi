<script>
import actions from "../store/actions.js";
import getters from "../store/getters.js";
import HelpPanel from "./HelpSection/HelpPanel.vue";
import HomePanel from "./HomePanel.vue";
import {mapGetters, mapActions, mapMutations} from "vuex";
import mutations from "../store/mutations.js";
// import EnsembleDetails from "./Ensemble/EnsembleDetails.vue";
// import EnsembleCreation from "./Ensemble/EnsembleCreation.vue";
// import EnsembleList from "./Ensemble/EnsembleList.vue";
import JobDetails from "./Job/JobDetails.vue";
import JobExecution from "./Job/JobExecution.vue";
import JobList from "./Job/JobList.vue";
import layerCollection from "../../../src/core/layers/js/layerCollection.js";
import PlanningScenario from "./PlanningScenario/PlanningScenario.vue";
import ProcessDetails from "./Process/ProcessDetails.vue";
import ProcessList from "./Process/ProcessList.vue";
import SideMenu from "./SideMenu.vue";
import SimulationList from "./Simulation/SimulationList.vue";
import SimulationParameter from "./Simulation/SimulationParameter.vue";
import simulationResults from "./Simulation/SimulationResults.vue";
import {infrastructureLayerId} from "../layerIds.js";
import {readAllPlanningScenariosFromIndexedDb} from "../js/planningScenariosIndexedDb.js";
import isObject from "@shared/js/utils/isObject.js";

import TutorialPanel from "./HelpSection/TutorialPanel.vue";

const MIN_WIDTH_PERCENT = 40;

export default {
    name: "SimulationTool",
    components: {
        // EnsembleDetails,
        // EnsembleCreation,
        // EnsembleList,
        HomePanel,
        HelpPanel,
        JobDetails,
        JobExecution,
        JobList,
        PlanningScenario,
        ProcessDetails,
        ProcessList,
        SideMenu,
        SimulationList,
        SimulationParameter,
        simulationResults,
        TutorialPanel
    },
    computed: {
        ...mapGetters("Modules/SimulationTool", Object.keys(getters))
    },
    mounted: async function () {
        await this.checkLoggedIn();
        if (this.shouldSaveSimulations) {
            await this.restorePlanningScenariosFromIndexedDb();
        }
        this.maximizeDrawer();
        this.fetchProcesses();
        this.fetchJobs();
        // this.fetchEnsembles();
        // this.fetchProviders();
    },
    unmounted () {
        if (typeof layerCollection.getLayerById("planning-scenario") !== "undefined") {
            layerCollection.getLayerById("planning-scenario").getLayerSource().clear();
        }
        if (typeof layerCollection.getLayerById(infrastructureLayerId) !== "undefined") {
            layerCollection.getLayerById(infrastructureLayerId).getLayerSource().clear();
        }
    },
    /**
     * Put initialize here if mounting occurs after config parsing
     * @returns {void}
     */
    methods: {
        ...mapActions("Modules/Login", [
            "checkLoggedIn"
        ]),
        ...mapMutations("Menu", [
            "setCurrentMenuWidth"
        ]),
        ...mapMutations("Modules/SimulationTool", Object.keys(mutations)),
        ...mapActions("Modules/SimulationTool", Object.keys(actions)),

        /**
         * Loads all planning scenarios from indexedDB and merges missing entries into the store.
         * @returns {Promise<void>}
         */
        async restorePlanningScenariosFromIndexedDb () {
            try {
                const persistedScenarios = await readAllPlanningScenariosFromIndexedDb();

                if (!Array.isArray(persistedScenarios) || !persistedScenarios.length) {
                    return;
                }

                const scenariosById = new Map(
                    (Array.isArray(this.planningScenarios) ? this.planningScenarios : [])
                        .filter(scenario => scenario && typeof scenario.id === "string")
                        .map(scenario => [scenario.id, scenario])
                );

                persistedScenarios.forEach(scenario => {
                    if (scenario && typeof scenario.id === "string") {
                        scenariosById.set(scenario.id, scenario);
                    }
                });

                const mergedScenarios = Array.from(scenariosById.values());

                this.setPlanningScenarios(mergedScenarios);
                await this.resumePendingJobsFromScenarios(mergedScenarios);
            }
            catch (error) {
                console.warn("Could not restore planning scenarios from indexedDB.", error);
            }
        },

        /**
         * Resumes pending jobs from restored planning scenarios.
         * Jobs with status "accepted" or "running" are polled concurrently.
         * @param {Object[]} scenarios Restored planning scenarios.
         * @returns {Promise<void>}
         */
        async resumePendingJobsFromScenarios (scenarios) {
            if (!Array.isArray(scenarios) || !scenarios.length) {
                return;
            }

            const pendingStatuses = new Set(["accepted", "running"]);
            const pollingPromises = [];

            scenarios.forEach(scenario => {
                if (!isObject(scenario?.simulations)) {
                    return;
                }

                Object.values(scenario.simulations).forEach(simulation => {
                    if (!isObject(simulation?.jobs)) {
                        return;
                    }

                    const simulationConfig = this.simulations.find(config => config.id === simulation.configId);

                    if (!simulationConfig?.processes?.length) {
                        return;
                    }

                    const pendingEntries = Object.entries(simulation.jobs)
                        .map(([jobId, job], index) => ({
                            job,
                            jobId,
                            processConfig: simulationConfig.processes[index]
                        }))
                        .filter(({job, processConfig}) => {
                            return pendingStatuses.has(job?.jobStatus?.status)
                                && isObject(processConfig)
                                && processConfig.url
                                && processConfig.id;
                        });

                    if (!pendingEntries.length) {
                        return;
                    }

                    pollingPromises.push(this.pollAndAssignSimulationJobsResults({
                        jobs: pendingEntries.map(({job}) => job),
                        jobIds: pendingEntries.map(({jobId}) => jobId),
                        processConfigs: pendingEntries.map(({processConfig}) => processConfig),
                        simulationConfig
                    }));
                });
            });

            if (!pollingPromises.length) {
                return;
            }

            await Promise.all(pollingPromises);
        },

        maximizeDrawer () {
            this.setCurrentMenuWidth({
                side: "secondaryMenu",
                width: MIN_WIDTH_PERCENT + "dvw"
            });
        },
        /**
         * Selects a process by id
         * @returns {void}
         */
        selectProcess ({id, mode}) {
            this.setSelectedProcessId(id);
            this.setMode(mode);
        }
        // /**
        //  * Selects a job by id
        //  * @returns {void}
        //  */
        // selectJob (id) {
        //     this.setSelectedJobId(typeof id === "string" ? id : null);
        // },
        // navigate(evt) {
        //     const kensemblesey = evt.target.dataset.key;
        //     if (key) {
        //         this.setMode(key);
        //     }
        // }
    }
};
</script>

<template>
    <div id="tool-simulationTool">
        <div class="content">
            <HomePanel
                v-if="mode === 'home-panel'"
                @selected="selectProcess"
            />
            <PlanningScenario
                v-if="mode === 'planningScenario'"
            />
            <SimulationList
                v-if="mode === 'simulationList'"
            />
            <SimulationParameter
                v-if="mode === 'simulationParameter'"
            />
            <simulationResults
                v-if="mode === 'simulationResults'"
            />
            <ProcessList
                v-if="mode === 'process-list'"
                @selected="selectProcess"
            />
            <ProcessDetails
                v-if="mode === 'process-details'"
                @selected="selectProcess"
            />
            <HelpPanel
                v-if="mode === 'help-panel'"
            />
            <JobList
                v-if="mode === 'job-list'"
                :jobs="jobs"
            />
            <JobExecution
                v-if="mode === 'job-execution'"
            />
            <JobDetails
                v-if="mode === 'job-details'"
            />
            <!--<EnsembleList
                v-if="mode === 'ensemble-list'"
                :ensembles="ensembles"
            />
            <EnsembleCreation
                v-if="mode === 'ensemble-creation'"
            />
            <EnsembleDetails
                v-if="mode === 'ensemble-details'"
            /> -->
            <TutorialPanel
                v-if="mode === 'tutorial-panel'"
            />
        </div>
        <SideMenu />
    </div>
</template>

<style lang="scss" scoped>
    #tool-simulationTool {
        overflow: hidden;
        display: flex;
        flex: 1;

        .content {
            flex: 1 1 0;
            padding: 1rem;
        }
    }
</style>

<style lang="scss">
    .multiselect__option {
        background-color: unset;

        .option__desc .option__title {
            padding: .25rem .5rem;
            border-radius: .5rem;
        }
    }

    .multiselect__option--highlight,
    .multiselect__option--highlight:after {
        background-color: var(--bs-primary);
        color: var(--bs-primary-text-emphasis);
    }

    .multiselect__tag-icon::after {
        color: unset;
    }

    .status {
        display: inline-block;
        padding: .25rem .5rem;
        border-radius: .5rem;
        font-size: .875rem;
        font-weight: 500;
    }

    .accepted {
        background-color: var(--bs-info);
        color: black;
    }
    .running {
        background-color: var(--bs-warning);
        color: black;
    }
    .successful {
        background-color: var(--bs-success);
        color: white;
    }
    .dismissed {
        background-color: var(--bs-secondary);
        color: white;
    }
    .failed {
        background-color: var(--bs-danger);
        color: white;
    }
</style>
