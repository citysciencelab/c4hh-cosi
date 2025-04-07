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
        ...mapMutations("Modules/SimulationTool", ["setPlanningScenarios"]),

        /**
         * Removes a scenario by the passed id from the list of scenarios.
         * @param {Object[]} scenarios - The current list of scenarios.
         * @param {String} id - The id of the scenario to remove.
         * @returns {void}
         */
        removeScenarioById (scenarios, id) {
            const filteredScenarios = scenarios.filter(item => item.id !== id);

            this.setPlanningScenarios(filteredScenarios);
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
                    />
                    <div class="vr me-2" />
                    <IconButton
                        :class-array="['btn-light', 'me-2']"
                        :icon="'bi-pencil-square'"
                        :aria="$t('additional:modules.tools.simulationTool.planningScenarioEdit')"
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
