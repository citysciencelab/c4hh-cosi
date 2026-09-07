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
         * Returns the appropriate badge based on the feature's properties.
         * @param {ol/Feature} feature - The feature object to evaluate.
         * @returns {Array} - An array containing a single badge object.
         */
        getBadge (feature) {
            if (feature.get("isSimulation")) {
                return [{
                    backgroundColor: "#3c5f94",
                    color: "#ffffff",
                    icon: null,
                    text: "Neu"
                }];
            }
            return [{
                backgroundColor: "#f3b020",
                color: "#ffffff",
                icon: null,
                text: "Geändert"
            }];
        },

        /*
        * Returns the appropriate close icon based on the feature's properties.
        * @param {ol/Feature} feature - The feature object to evaluate.
        * @returns {String} - The icon class name for the close button.
        */
        getCloseIcon (feature) {
            return feature.get("isSimulation") ? "bi bi-trash" : "bi bi-arrow-clockwise";
        },

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
                :badge-list="getBadge(card.feature)"
                :close-icon="getCloseIcon(card.feature)"
                :disabled="isSubjectDataSelected"
                :icon-src="card.iconSrc"
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
