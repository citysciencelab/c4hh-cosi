<script>
import TutorialPage from "./TutorialPage.vue";
import {mapGetters} from "vuex";

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
        :section-title="$t('additional:modules.tools.simulationTool.ensembleOverview')"
        :sections="[
            { type: 'text', content: $t('additional:modules.tools.simulationTool.ensembleOverviewContent') },
            { type: 'image', src: img.tutorialEnsembleOverview, alt: 'TutorialEnsembleOverview' },
        ]"
        :hints-title="$t('additional:modules.tools.simulationTool.hints')"
        :hints="[
            $t('additional:modules.tools.simulationTool.ensembleOverviewHint')
        ]"
    />
</template>
