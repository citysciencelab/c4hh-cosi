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
    props: {
        isSubjectDataSelected: {
            type: Boolean,
            default: false
        }
    },

    emits: ["toggle-object-status"],

    computed: {
        ...mapGetters("Modules/ScenarioBuilder", ["activeScenarioCard"]),

        visibleObjectCards () {
            return this.activeScenarioCard.objects.filter(card => card.isVisible === true);
        }
    },

    methods: {
        /**
         * Removes an object card from the active scenario card.
         * @param {String|Number} cardId - Id of the object card to remove.
         * @returns {void}
         */
        removeObjectCard (cardId) {
            this.$emit("remove-object-card", cardId);
        },

        /**
         * Toggles the status of a card at the specified index.
         * @param {String|Number} cardId - Id of the card to toggle.
         * @return {void}
         */
        toggleObjectStatus (cardId) {
            const index = this.activeScenarioCard.objects.findIndex(card => card.id === cardId);

            if (index === -1) {
                return;
            }

            this.$emit("toggle-object-status", index);
        }
    }
};
</script>

<template lang="html">
    <div
        v-if="visibleObjectCards.length"
        class="mb-4 py-2"
    >
        <div
            v-for="card in visibleObjectCards"
            :key="card.id"
            class="mb-3"
        >
            <SimpleCard
                hoverable
                :icon-src="card.iconSrc"
                :disabled="isSubjectDataSelected"
                :label="card.label"
                :status="card.status"
                :text="card.text"
                @click="toggleObjectStatus(card.id)"
                @click:close="removeObjectCard(card.id)"
            />
        </div>
    </div>
    <AlertMessage
        v-else
        :text="$t('additional:modules.tools.cosi.objectManager.alertNoObject')"
        type="info"
    />
</template>
