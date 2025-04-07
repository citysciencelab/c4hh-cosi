<script>
import {mapGetters, mapMutations} from "vuex";
import PlanningScenarioCreate from "./PlanningScenarioCreate.vue";
import PlanningScenarioOverview from "./PlanningScenarioOverview.vue";

export default {
    name: "PlanningScenario",
    components: {
        PlanningScenarioCreate,
        PlanningScenarioOverview
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
    </div>
</template>

<style scoped lang="scss">

</style>
