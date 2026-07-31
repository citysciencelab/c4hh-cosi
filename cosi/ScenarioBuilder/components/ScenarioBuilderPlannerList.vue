<script>
import AlertMessage from "../../shared/modules/alerts/components/AlertMessage.vue";
import {mapGetters} from "vuex";
import SimpleCard from "../../shared/modules/cards/components/SimpleCard.vue";

export default {
    components: {
        AlertMessage,
        SimpleCard
    },

    inject: ["removeFeatureFromScenario"],

    emits: ["set-is-location-active", "toggle-object-status"],

    computed: {
        ...mapGetters("Modules/ScenarioBuilder", ["activeScenarioCard"])
    },

    methods: {
        /**
         * Removes an object card from the active scenario card.
         * @param {Number} index - Index of the object card to remove
         * @returns {void}
         */
        removeObjectCard (index) {
            const feature = this.activeScenarioCard.objects[index].feature;

            this.removeFeatureFromScenario(feature);
            this.activeScenarioCard.objects.splice(index, 1);
        },

        /**
         * Toggles the status of a card at the specified index.
         * @param {Number} index - Index of the card to toggle
         * @return {void}
         */
        toggleObjectStatus (index) {
            this.$emit("toggle-object-status", index);
            this.$emit("set-is-location-active", false);
        }
    }
};
</script>

<template lang="html">
    <div
        v-if="activeScenarioCard.objects.length"
        class="mb-4 py-2"
    >
        <div
            v-for="(card, index) in activeScenarioCard.objects"
            :key="card.id"
            class="mb-3"
        >
            <SimpleCard
                hoverable
                :icon="card.icon"
                :label="card.label"
                :status="card.status"
                :text="card.text"
                @click="toggleObjectStatus(index)"
                @click:close="removeObjectCard(index)"
            />
        </div>
    </div>
    <AlertMessage
        v-else
        :text="$t('additional:modules.tools.cosi.objectManager.alertNoObject')"
        type="info"
    />
</template>
