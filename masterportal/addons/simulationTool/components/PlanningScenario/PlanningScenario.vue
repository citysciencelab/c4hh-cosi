<script>
import {mapGetters, mapMutations} from "vuex";
import PlanningScenarioCreate from "./PlanningScenarioCreate.vue";
import PlanningScenarioOverview from "./PlanningScenarioOverview.vue";
import PlanningScenarioLanduse from "./PlanningScenarioLanduse.vue";
import PlanningScenarioLanduseCreate from "./PlanningScenarioLanduseCreate.vue";


export default {
    name: "PlanningScenario",
    components: {
        PlanningScenarioCreate,
        PlanningScenarioOverview,
        PlanningScenarioLanduse,
        PlanningScenarioLanduseCreate
    },
    computed: {
        ...mapGetters("Modules/SimulationTool", [
            "currentPlanningComponent"
        ])
    },
    methods: {
        ...mapMutations("Modules/SimulationTool", [
            "setCurrentPlanningComponent"
        ])
    }
};

</script>

<template>
    <div>
        <PlanningScenarioOverview
            v-if="currentPlanningComponent === ''"
            @open-create-scenario="setCurrentPlanningComponent('create')"
        />
        <PlanningScenarioCreate
            v-if="currentPlanningComponent === 'create'"
        />
        <PlanningScenarioLanduse
            v-if="currentPlanningComponent === 'landuse'"
        />
        <PlanningScenarioLanduseCreate
            v-if="currentPlanningComponent === 'newLanduse'"
        />
    </div>
</template>

<style scoped lang="scss">

</style>
