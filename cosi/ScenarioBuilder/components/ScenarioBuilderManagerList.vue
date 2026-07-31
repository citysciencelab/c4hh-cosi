<script>
import AlertMessage from "../../shared/modules/alerts/components/AlertMessage.vue";
import Card from "../../shared/modules/cards/components/Card.vue";
import {downloadJsonToFile} from "../../utils/download";
import {featureToGeoJson} from "../../utils/features/convertToGeoJson";
import IconButton from "@shared/modules/buttons/components/IconButton.vue";
import {mapGetters} from "vuex";

export default {
    name: "ScenarioBuilderManagerList",
    components: {
        AlertMessage,
        Card,
        IconButton
    },
    inject: ["toggleCurrentView"],
    computed: {
        ...mapGetters("Modules/ScenarioBuilder", ["scenarioCards"])
    },

    methods: {
        /**
         * Creates a deep copy of a scenario card for download.
         * Scenario features are converted to WKT.
         * @param {Object} item - The scenario card to export.
         * @returns {Object} The copied scenario card.
         */
        createScenarioDownloadCopy (item) {
            return {
                ...item,
                objects: item.objects.map(obj => {
                    return featureToGeoJson(obj.feature);
                })
            };
        },

        downloadScenario (item) {
            const itemCopy = this.createScenarioDownloadCopy(item);

            downloadJsonToFile(itemCopy, itemCopy.title + ".json");
        },

        /**
         * Removes a card from the cards array at the specified index.
         * @param {Number} index - Index of the card to be removed
         * @return {void}
         */
        removeScenarioCard (index) {
            this.scenarioCards.splice(index, 1);
        },

        /**
         * Toggles the status of a card at the specified index.
         * @param {Number} index - Index of the card to toggle
         * @return {void}
         */
        toggleActiveScenario (index) {
            this.$emit("toggle-active-scenario", index);
        }

    }
};
</script>

<template lang="html">
    <div
        v-if="scenarioCards.length"
        class="mb-4 py-2"
    >
        <div
            v-for="(item, index) in scenarioCards"
            :key="item"
        >
            <Card
                class="d-flex flex-column-reverse"
                :data="item.data"
                :downloadable="item.downloadable"
                :icon="item.icon"
                :visible="false"
                :status="item.status"
                @click="toggleActiveScenario(index)"
                @remove-set="removeScenarioCard(index)"
                @download-set="downloadScenario(item)"
            >
                <template #custom-icon-button>
                    <IconButton
                        class="p-1"
                        :aria="'Externen Link öffnen'"
                        icon="bi bi-pencil"
                        @click.stop="toggleCurrentView('planner')"
                    />
                </template>
            </Card>
        </div>
    </div>
    <AlertMessage
        v-else
        :text="$t('additional:modules.tools.cosi.scenarioManager.alertNoScenario')"
        type="info"
    />
</template>

<style lang="scss" scoped>

</style>
