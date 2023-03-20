<script>
import {mapGetters} from "vuex";
import StatisticsTable from "./StatisticsTable.vue";
import Modal from "../../../../src/share-components/modals/components/ModalItem.vue";

export default {
    name: "NeighborhoodEditor",
    components: {
        Modal,
        StatisticsTable
    },
    props: {
        drawingLayer: {
            type: Object,
            default: undefined
        }
    },
    data: () => ({
        datePicker: false,
        editDialog: false,
        editModal: false,
        selectedNeighborhood: {
            scenarioFeature: null,
            editFeature: null
        },
        confirmDialog: false,
        map: undefined
    }),
    computed: {
        ...mapGetters("Tools/ScenarioBuilder", ["activeScenario"]),
        neighborhoodName () {
            return this.selectedNeighborhood.editFeature?.get("name");
        },
        neighborhoodYear () {
            return this.selectedNeighborhood.editFeature?.get("year");
        },
        neighborhoodStats () {
            return this.selectedNeighborhood.editFeature?.get("stats");
        },
        baseStats () {
            return this.selectedNeighborhood.editFeature?.get("baseStats");
        },
        confirmText () {
            return this.$t("additional:modules.tools.cosi.neighborhoodEditor.confirmDelete");
        }
    },
    mounted () {
        this.map = mapCollection.getMap("2D");
        this.map.addEventListener("click", this.openEditDialog.bind(this));
    },
    methods: {
        openEditDialog (evt) {
            this.selectedNeighborhood.editFeature = null;
            this.selectedNeighborhood.scenarioFeature = null;
            this.map.forEachFeatureAtPixel(evt.pixel, feature => {
                this.selectedNeighborhood.scenarioFeature = this.activeScenario.getNeighborhood(feature);
                this.selectedNeighborhood.editFeature = feature.clone();

                // ugly, but necessary
                this.selectedNeighborhood.editFeature.set("stats", JSON.parse(JSON.stringify(feature.get("stats"))));

                this.editDialog = true;
            }, {
                layerFilter: l => l === this.drawingLayer
            });

            if (!this.selectedNeighborhood.editFeature) {
                this.editDialog = false;
            }
        },

        editNeighborhood () {
            this.editModal = true;
            this.editDialog = false;
        },

        updateSelectedNeighborhood () {
            this.selectedNeighborhood.scenarioFeature.setFeature(this.selectedNeighborhood.editFeature);
            this.escapeEditModal();
        },

        editProp (v, prop) {
            this.selectedNeighborhood.editFeature.set(prop, v);
        },

        deleteNeighborhood () {
            this.activeScenario.removeNeighborhood(this.selectedNeighborhood.scenarioFeature.feature);
            this.confirmDialog = false;
            this.editDialog = false;
            this.selectedNeighborhood.editFeature = null;
            this.selectedNeighborhood.scenarioFeature = null;
        },

        escapeEditModal () {
            this.selectedNeighborhood.editFeature = null;
            this.selectedNeighborhood.scenarioFeature = null;
            this.editModal = false;
        },

        visualizeDemographics () {
            this.$emit("visualizeDemographics", this.baseStats);
            this.editModal = false;
        }
    }
};
</script>

<template>
    <v-app>
        <v-snackbar
            v-model="confirmDialog"
            :timeout="-1"
            color="white"
            light
            centered
        >
            {{ confirmText }}

            <template #action="{ attrs }">
                <v-btn
                    v-bind="attrs"
                    text
                    @click="deleteNeighborhood"
                >
                    {{ $t('common:button.delete') }}
                </v-btn>
                <v-btn
                    text
                    v-bind="attrs"
                    @click="confirmDialog = false"
                >
                    {{ $t('common:button.cancel') }}
                </v-btn>
            </template>
        </v-snackbar>
        <v-snackbar
            v-model="editDialog"
            :timeout="-1"
            color="grey"
        >
            {{ $t('additional:modules.tools.cosi.residentialSimulation.editFeature') }}

            <template #action="{ attrs }">
                <v-btn
                    v-bind="attrs"
                    text
                    @click="confirmDialog = true"
                >
                    {{ $t("common:button.delete") }}
                </v-btn>
                <v-btn
                    v-bind="attrs"
                    text
                    @click="editNeighborhood"
                >
                    {{ $t("common:button.edit") }}
                </v-btn>
                <v-btn
                    text
                    v-bind="attrs"
                    @click="editDialog = false"
                >
                    <v-icon>mdi-close</v-icon>
                </v-btn>
            </template>
        </v-snackbar>
        <Modal
            v-if="selectedNeighborhood.editFeature"
            :show-modal="editModal"
            @modalHid="escapeEditModal"
            @clickedOnX="escapeEditModal"
            @clickedOutside="escapeEditModal"
        >
            <v-app>
                <v-container>
                    <v-card-title primary-title>
                        {{ $t("additional:modules.tools.cosi.statisticsTable.editStatsTable") }} : {{ neighborhoodName }}
                    </v-card-title>
                    <v-card-subtitle>
                        {{ $t("additional:modules.tools.cosi.residentialSimulation.referencePicker.reference") }} ({{ baseStats.reference.districtLevel }}): {{ baseStats.reference.districtName }}
                    </v-card-subtitle>
                    <v-card-text>
                        <v-row dense>
                            <v-col
                                class="flex"
                                cols="12"
                            >
                                <v-text-field
                                    :value="neighborhoodYear"
                                    :label="$t('additional:modules.tools.cosi.residentialSimulation.dateOfCompletion')"
                                    :rules="[
                                        value => Boolean(value) || $t('additional:modules.tools.cosi.scenarioBuilder.required'),
                                        value => value.match(/^\d{4}\-(0?[1-9]|1[012])$/) !== null || $t('additional:modules.tools.cosi.neighborhoodEditor.invalidDate')
                                    ]"
                                    prepend-icon="mdi-calendar"
                                    @change="editProp($event, 'year')"
                                />
                                <v-text-field
                                    :value="neighborhoodName"
                                    :label="$t('additional:modules.tools.cosi.neighborhoodEditor.changeName')"
                                    :rules="[
                                        value => Boolean(value) || $t('additional:modules.tools.cosi.scenarioBuilder.required'),
                                    ]"
                                    prepend-icon="mdi-home"
                                    @change="editProp($event, 'name')"
                                />
                            </v-col>
                        </v-row>
                    </v-card-text>
                    <div class="stats-table-modal">
                        <StatisticsTable
                            :value="neighborhoodStats"
                        />
                    </div>
                    <v-card-actions>
                        <v-btn
                            dense
                            small
                            tile
                            color="primary"
                            :title="$t('additional:modules.tools.cosi.neighborhoodEditor.updateStats')"
                            @click="updateSelectedNeighborhood"
                        >
                            <v-icon>mdi-pencil</v-icon>
                            <span>
                                {{ $t('additional:modules.tools.cosi.neighborhoodEditor.updateStats') }}
                            </span>
                        </v-btn>
                        <v-btn
                            dense
                            small
                            tile
                            color="grey lighten-1"
                            :title="$t('common:button.cancel')"
                            @click="escapeEditModal"
                        >
                            <v-icon>mdi-close</v-icon>
                            <span>
                                {{ $t('common:button.cancel') }}
                            </span>
                        </v-btn>
                        <v-btn
                            dense
                            small
                            tile
                            color="grey lighten-1"
                            :title="$t('additional:modules.tools.cosi.residentialSimulation.visualizeDemographics')"
                            @click="visualizeDemographics"
                        >
                            <v-icon>mdi-chart-bell-curve</v-icon>
                            <span>
                                {{ $t('additional:modules.tools.cosi.residentialSimulation.visualizeDemographics') }}
                            </span>
                        </v-btn>
                    </v-card-actions>
                </v-container>
            </v-app>
        </Modal>
    </v-app>
</template>

<style lang="scss" scoped>
    .flex {
        display: flex;
        .flex-item {
            margin: 0 2px 0 2px;
        }
    }
</style>
