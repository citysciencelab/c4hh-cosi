<script>
import SectionHeader from "../SectionHeader.vue";

export default {
    name: "SimulationResults",
    components: {
        SectionHeader
    }
};
</script>

<template>
    <div class="vh-100 overflow-y-auto">
        <SectionHeader
            :title="$t('additional:modules.tools.simulationTool.simulationResults')"
        />
    </div>
</template>

<style lang="scss" scoped>
@import "~variables";

</style>
