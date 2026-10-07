<script>
import {mapGetters} from "vuex";
import ScenarioBuilderManagerAdd from "./ScenarioBuilderManagerAdd.vue";
import ScenarioBuilderManagerList from "./ScenarioBuilderManagerList.vue";

export default {
    name: "ScenarioBuilderManager",

    components: {
        ScenarioBuilderManagerAdd,
        ScenarioBuilderManagerList
    },

    computed: {
        ...mapGetters("Modules/ScenarioBuilder", ["scenarioCards"])
    },

    methods: {
        /**
         * Toggles the status of a card at the specified index.
         * @param {Number} index - Index of the card to toggle
         * @return {void}
         */
        toggleScenarioStatus (index) {
            const activeIndex = this.scenarioCards.findIndex(card => card.status === "active");

            if (activeIndex === index) {
                this.scenarioCards[index].status = "active";
                return;
            }

            if (activeIndex !== -1 && activeIndex !== index) {
                this.scenarioCards[activeIndex].status = "";
            }
            this.scenarioCards[index].status = "active";
        }
    }
};
</script>

<template lang="html">
    <div>
        <h5>
            {{ $t('additional:modules.tools.cosi.scenarioManager.title') }}
        </h5>
        <ScenarioBuilderManagerList
            @toggle-active-scenario="toggleScenarioStatus"
        />
        <ScenarioBuilderManagerAdd
            @toggle-active-scenario="toggleScenarioStatus"
        />
    </div>
</template>
