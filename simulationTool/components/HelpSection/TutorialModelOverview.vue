<script>
import {mapGetters} from "vuex";
import TutorialPage from "./TutorialPage.vue";

export default {
    components: {TutorialPage},
    computed: {
        ...mapGetters("Modules/SimulationTool", ["img"])
    }
};
</script>

<template>
    <TutorialPage
        :tutorial-title="$t('additional:modules.tools.simulationTool.tutorial')"
        :section-title="$t('additional:modules.tools.simulationTool.modelOverview')"
        :sections="[
            { type: 'text', content: $t('additional:modules.tools.simulationTool.modelOverviewContent') },
            { type: 'image', src: img.tutorialModelOverview, alt: 'TutorialModelOverview' },
        ]"
        :hints-title="$t('additional:modules.tools.simulationTool.hints')"
        :hints="[
            $t('additional:modules.tools.simulationTool.modelOverviewHint')
        ]"
    />
</template>
