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
        :section-title="$t('additional:modules.tools.simulationTool.ensembleDetails')"
        :sections="[
            { type: 'text', content: $t('additional:modules.tools.simulationTool.ensembleDetailsContent') },
            { type: 'image', src: img.tutorialEnsembleDetails, alt: 'TutorialEnsembleDetails' },
        ]"
    />
</template>
