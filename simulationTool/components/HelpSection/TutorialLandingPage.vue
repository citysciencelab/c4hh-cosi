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
        :section-title="$t('additional:modules.tools.simulationTool.landingPage')"
        :sections="[
            { type: 'text', content: $t('additional:modules.tools.simulationTool.landingPageContent') },
            { type: 'image', src: img.tutorialLandingPage, alt: 'TutorialLandingPage' },
        ]"
    />
</template>
