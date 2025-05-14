<script>
import AccordionItem from "../../../../src/shared/modules/accordion/components/AccordionItem.vue";
import {getMappedProperty} from "../shared/js/getMappedProperty";
import {mapGetters} from "vuex/dist/vuex.cjs.js";
import SectionHeader from "../SectionHeader.vue";

export default {
    name: "SimulationResults",
    components: {
        AccordionItem,
        SectionHeader
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
    methods: {
        getMappedProperty
    }
};
</script>

<template>
    <div class="vh-100 overflow-y-auto">
        <SectionHeader
            :title="$t('additional:modules.tools.simulationTool.simulationResults')"
        />
        <h5>{{ currentJobID }}</h5>
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
</template>

<style lang="scss" scoped>
@import "~variables";

</style>
