<script>
import {mapGetters} from "vuex/dist/vuex.cjs.js";
import SectionHeader from "../SectionHeader.vue";

export default {
    name: "SimulationResults",
    components: {
        SectionHeader
    },
    computed: {
        ...mapGetters("Modules/SimulationTool", ["currentJobID"])
    }
};
</script>

<template>
    <div class="vh-100 overflow-y-auto">
        <SectionHeader
            :title="$t('additional:modules.tools.simulationTool.simulationResults')"
        />
        {{ currentJobID }}
    </div>
</template>

<style lang="scss" scoped>
@import "~variables";

</style>
