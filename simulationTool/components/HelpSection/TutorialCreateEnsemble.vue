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
        :section-title="$t('additional:modules.tools.simulationTool.createEnsemble')"
        :sections="[
            { type: 'text', content: $t('additional:modules.tools.simulationTool.createEnsembleContent') },
            { type: 'image', src: img.tutorialCreateEnsemble1, alt: 'TutorialCreateEnsemble1' },
            { type: 'text', content: $t('additional:modules.tools.simulationTool.createEnsembleContent2') },
            { type: 'image', src: img.tutorialCreateEnsemble2, alt: 'TutorialCreateEnsemble2' },
            { type: 'text', content: $t('additional:modules.tools.simulationTool.createEnsembleContent3') },
            { type: 'image', src: img.tutorialCreateEnsemble3, alt: 'TutorialCreateEnsemble3' }
        ]"
        :hints-title="$t('additional:modules.tools.simulationTool.hints')"
        :hints="[
            $t('additional:modules.tools.simulationTool.createEnsembleHint')
        ]"
    />
</template>
