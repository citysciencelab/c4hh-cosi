<script>
import AccordionItem from "../../../../src/shared/modules/accordion/components/AccordionItem.vue";
import dayjs from "dayjs";
import {getMappedProperty} from "../shared/js/getMappedProperty";
import isObject from "../../../../src/shared/js/utils/isObject";
import {mapGetters} from "vuex/dist/vuex.cjs.js";
import SectionHeader from "../SectionHeader.vue";

export default {
    name: "SimulationResults",
    components: {
        AccordionItem,
        SectionHeader
    },
    data () {
        return {
            jobStatus: {},
            scenarioName: "",
            started: "",
            finished: ""
        };
    },
    computed: {
        ...mapGetters("Modules/SimulationTool", ["currentJobID", "planningScenarios", "simulations"]),

        /**
         * Get the current job based on the current job ID.
         * @returns {Object} The current job.
         */
        currentJob () {
            return this.currentPlanningScenario?.jobs?.[this.currentJobID];
        },

        /**
         * Get the planning scenario containing the current job.
         * @returns {Object} The current planning scenario.
         */
        currentPlanningScenario () {
            return this.planningScenarios?.find(scenario => scenario?.jobs?.[this.currentJobID]);
        },

        /**
        * Get the simulation configuration to the currently selected planning scenario.
        * @returns {Object} The current simulation configuration.
        */
        simulation () {
            return this.simulations?.find(simulation => simulation.id === this.currentPlanningScenario?.simulationId);
        }
    },
    mounted () {
        this.planningScenarios?.forEach(scenario => {
            this.setData(scenario, this.currentJobID);
        });
    },
    methods: {
        getMappedProperty,
        /**
         * Sets the job status data.
         * @param {Object} scenario - The scenario
         * @param {string} jobId - The jobId
         * @returns {void}
         */
        setData (scenario, jobId) {
            if (!isObject(scenario) || !isObject(scenario.jobs) || typeof jobId !== "string") {
                return;
            }

            this.jobStatus = scenario.jobs[Object.keys(scenario.jobs).find(key => key === jobId)]?.jobStatus;
            this.scenarioName = scenario.name;
            this.started = this.jobStatus?.started ? dayjs(this.jobStatus?.started).format("DD.MM.YYYY, hh:mm:ss") : this.jobStatus?.started;
            this.finished = this.jobStatus?.finished ? dayjs(this.jobStatus?.finished).format("DD.MM.YYYY, hh:mm:ss") : this.jobStatus?.finished;
        }
    }
};
</script>

<template>
    <div class="vh-100 overflow-y-auto">
        <SectionHeader
            :title="$t('additional:modules.tools.simulationTool.simulationResults')"
        />
        <div v-if="currentJobID">
            <div
                class="d-flex"
            >
                <div
                    class="me-2"
                >
                    {{ $t('additional:modules.tools.simulationTool.planningScenario') }} {{ scenarioName }}
                </div>
            </div>
            <div
                class="d-flex"
            >
                <div
                    class="me-2 fw-bold"
                >
                    {{ $t('additional:modules.tools.simulationTool.started') }}:
                </div>
                <div
                    class="me-2"
                >
                    {{ started }}
                </div>
            </div>
            <div
                class="d-flex"
            >
                <div
                    class="me-2 fw-bold"
                >
                    {{ $t('additional:modules.tools.simulationTool.finished') }}:
                </div>
                <div
                    class="me-2"
                >
                    {{ finished }}
                </div>
            </div>
            <div
                class="d-flex"
            >
                <div
                    class="me-2 fw-bold"
                >
                    {{ $t('additional:modules.tools.simulationTool.status') }}:
                </div>
                <div
                    class="me-2"
                >
                    {{ jobStatus.status }}
                </div>
            </div>
            <AccordionItem
                v-if="currentJob"
                id="simulation-results-accordion-inputs"
                :title="$t('additional:modules.tools.simulationTool.inputParameters')"
            >
                <div
                    v-for="(input, inputKey) in currentJob?.requestBody?.inputs"
                    :key="inputKey"
                >
                    <div
                        v-if="typeof input === 'object' && input?.type !== 'FeatureCollection'"
                    >
                        <div
                            v-for="(property, propertyKey) in input"
                            :key="`${inputKey}-${propertyKey}`"
                        >
                            {{ getMappedProperty(propertyKey, simulation?.inputs?.[inputKey]?.propertiesMapping) }}: {{ property }} <br>
                        </div>
                    </div>
                </div>
            </AccordionItem>
        </div>
        <div
            v-else
            class="alert alert-primary"
        >
            {{ $t('additional:modules.tools.simulationTool.noJobsSelected') }}
        </div>
    </div>
</template>

<style lang="scss" scoped>
@import "~variables";

</style>
