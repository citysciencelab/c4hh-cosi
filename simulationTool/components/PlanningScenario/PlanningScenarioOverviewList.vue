<script>
import IconButton from "../../../../src/shared/modules/buttons/components/IconButton.vue";
import {mapGetters} from "vuex";

export default {
    name: "PlanningScenarioOverviewList",
    components: {
        IconButton
    },
    computed: {
        ...mapGetters("Modules/SimulationTool", ["planningScenarios"])
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
                        :class-array="['btn-light', 'me-2']"
                        :icon="'bi-download'"
                        :aria="$t('additional:modules.tools.simulationTool.planningScenarioDownload')"
                    />
                    <IconButton
                        :class-array="['btn-light']"
                        :icon="'bi-trash'"
                        :aria="$t('additional:modules.tools.simulationTool.planningScenarioDelete')"
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
