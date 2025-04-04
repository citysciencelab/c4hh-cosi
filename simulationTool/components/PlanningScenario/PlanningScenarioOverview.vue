<script>
import FileUpload from "../../../../src/shared/modules/inputs/components/FileUpload.vue";
import FlatButton from "../../../../src/shared/modules/buttons/components/FlatButton.vue";
import PlanningScenarioOverviewList from "./PlanningScenarioOverviewList.vue";

export default {
    name: "PlanningScenarioOverview",
    components: {
        FileUpload,
        FlatButton,
        PlanningScenarioOverviewList
    }
};

</script>
<template>
    <h4 class="text-decoration-underline mt-3">
        {{ $t("additional:modules.tools.simulationTool.planningScenarioOverview") }}
    </h4>
    <PlanningScenarioOverviewList />
    <FlatButton
        class="pe-2 mt-4"
        :aria-label="$t('additional:modules.tools.simulationTool.planningScenarioCreate')"
        :icon="'bi bi-pencil-square'"
        :text="$t('additional:modules.tools.simulationTool.planningScenarioCreate')"
    />
    <FlatButton
        class="pe-2 mt-4"
        :aria-label="$t('additional:modules.tools.simulationTool.planningScenarioDownloads')"
        :icon="'bi bi-download'"
        :text="$t('additional:modules.tools.simulationTool.planningScenarioDownloads')"
    />
    <FileUpload
        :id="'planningScenarioUpload'"
        :keydown="() => true"
        :change="() => true"
        :drop="() => true"
        class="mt-4"
    />
</template>

<style scoped lang="scss">
    #planningScenarioUpload {
        max-width: 300px;
    }
</style>
