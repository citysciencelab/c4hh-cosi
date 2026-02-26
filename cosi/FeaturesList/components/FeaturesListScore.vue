<script>
import DropdownAutocomplete from "../../shared/modules/dropdown/components/DropdownAutocomplete.vue";
import getNestedValues from "@shared/js/utils/getNestedValues.js";
import ToolInfo from "../../shared/modules/toolInfo/components/ToolInfo.vue";
import {treeSubjectsKey} from "@shared/js/utils/constants.js";
import Weights from "./FeaturesListScoreWeights.vue";
import {mapGetters, mapActions} from "vuex";
import deepEqual from "deep-equal";
import {VBtn} from "vuetify/components/VBtn";
import {VCard, VCardTitle, VCardText, VCardActions} from "vuetify/components/VCard";
// import {VIcon} from "vuetify/components/VIcon";
import {VProgressLinear} from "vuetify/components/VProgressLinear";
import {VRow} from "vuetify/components/VGrid";


export default {
    name: "FeaturesListScore",
    components: {
        DropdownAutocomplete,
        ToolInfo,
        VBtn,
        VCard,
        VCardActions,
        VCardText,
        VCardTitle,
        // VIcon,
        VProgressLinear,
        VRow,
        Weights
    },
    props: {
        featureList: {
            type: Array,
            required: true
        },
        groupedLayer: {
            type: Array,
            required: true
        }
    },
    data () {
        return {
            featureQueue: [],
            showWeightsDialog: false,
            selectedLayerList: [],
            disableChartButtons: true
        };
    },
    computed: {
        ...mapGetters(["allLayerConfigsStructured"]),

        /**
         * Gets the subject layer list as vuetify autocomplete items with subheaders.
         * @return {Object[]} The list of all subject layers.
         */
        layerList () {
            const list = [],
                subjectLayerConfigs = this.allLayerConfigsStructured(treeSubjectsKey);

            subjectLayerConfigs.forEach(config => {
                if (config.type !== "folder") {
                    return;
                }
                list.push({type: "subheader", name: config.name, level: 1});

                config.elements?.forEach(element => {
                    if (element.type !== "folder") {
                        return;
                    }
                    list.push({type: "subheader", name: element.name, level: 2});
                    list.push(...getNestedValues(element, "elements", true).flat(Infinity));
                });
            });
            return list;
        },


        /**
         * Indicates how far the calculation of the scores has gone.
         * @return {Number} A percent value.
         */
        progressValue () {
            if (this.featureQueue.length && this.featureList.length) {
                return Math.round(100 - this.featureQueue.length / this.featureList.length * 100);
            }
            return 0;
        },

        /**
         * Checks the queue of the featureList to see if the scores is being calculated.
         * @return {Boolean} True if the scores is just being calculated otherwise false.
         */
        scoringIsOngoing () {
            return this.featureQueue.length !== 0;
        }
    },

    watch: {
        featureList: {
            handler: function (newItems, oldItems) {
                if (!deepEqual(newItems.map(i=>i.key), oldItems.map(i=>i.key))) {
                    this.runFeaturesScore(this.featureList, this.selectedLayerList);
                }
                if (typeof newItems[0]?.distanceScore !== "undefined") {
                    this.disableChartButtons = false;
                }
            },
            deep: true
        }
    },
    methods: {
        ...mapActions("Modules/DistanceScoreService", ["getDistanceScore", "getFeatureValues"]),

        /**
         * Runs the scoring for the features. Emits the result to the parent component.
         * @param {Object[]} featureList - The list of features for which the scoring is to be run.
         * @param {Object[]} selectedLayerList - The list of layer to be included in the scoring.
         * @return {void}
         */
        async runFeaturesScore (featureList, selectedLayerList) {
            if (featureList && featureList.length && selectedLayerList.length > 0) {
                const items = [];

                this.featureQueue = featureList.map(item => {
                    return {...item};
                });

                while (this.featureQueue.length) {
                    const item = this.featureQueue.shift();

                    item.score = {
                        distance: await this.getDistanceScore({feature: item.feature, layers: selectedLayerList})
                    };
                    item.score.value = this.getFeatureScore(item.score);
                    item.distanceScore = item.score.value;
                    items.push(item);
                }

                this.$emit("updateItems", items);
            }
        },

        /**
         * Gets the total score for a feature.
         * So far only the score for the distance is used.
         * @param {Object} scores - Contains the different scores.
         * @return {String} The total score for a feature.
         */
        getFeatureScore (scores) {
            let totalScore = 0;

            Object.keys(scores).forEach(type => {
                totalScore += parseFloat(scores[type].average, 10);
            });

            return (totalScore / Object.keys(scores).length).toFixed(1);
        },

        /**
         * Toggles the layer weights dialog.
         * When the dialog is closed, the function for setting the scores is called.
         * @param {Boolean} value - Flag to show the dialog.
         * @return {void}
         */
        toggleWeightsDialog (value) {
            this.showWeightsDialog = value;
            if (!value) {
                this.runFeaturesScore(this.featureList, this.selectedLayerList);
            }
        }
    }
};
</script>

<template>
    <v-card
        outlined
        rounded="0"
        class="mb-4 overflow-visible"
    >
        <v-progress-linear
            v-if="progressValue > 0"
            :value="progressValue"
            height="25"
        >
            <strong>{{ progressValue }}%</strong>
        </v-progress-linear>
        <v-card-title>
            {{ $t('additional:modules.tools.cosi.featuresList.titleLocationScore') }}
        </v-card-title>
        <v-card-text>
            <ToolInfo
                :summary="'Die Entfernung (Fußweg) zur nächstgelegenen ausgewählten Einrichtung wird berechnet. Werden mehrere Einrichtungen ausgewählt, wird die Entfernung gemittelt.'"
            />
            <v-row
                dense
            >
                <DropdownAutocomplete
                    id="selectedDistanceScoreLayers"
                    v-model="selectedLayerList"
                    class="rounded-0 mb-3"
                    :items="layerList"
                    :label="$t('additional:modules.tools.cosi.featuresList.distanceScoreLayerLabel')"
                    outlined
                    :disabled="scoringIsOngoing"
                    dense
                    item-title="name"
                    return-object
                    hide-details
                    chips
                    clearable
                    deletable-chips
                    multiple
                    small-chips
                />
            </v-row>
        </v-card-text>
        <v-card-actions>
            <v-btn
                class="ml-1"
                depressed
                :disabled="scoringIsOngoing || selectedLayerList.length === 0"
                tile
                color="grey lighten-1"
                @click.native="runFeaturesScore(featureList, selectedLayerList)"
            >
                Berechnung starten
            </v-btn>
            <v-btn
                depressed
                :disabled="scoringIsOngoing || selectedLayerList.length < 2"
                tile
                color="grey lighten-1"
                @click.native="toggleWeightsDialog(true)"
            >
                {{ $t('additional:modules.tools.cosi.featuresList.weighting') }}
            </v-btn>
            <!--
            <v-btn
                depressed
                :disabled="scoringIsOngoing || disableChartButtons"
                tile
                color="grey lighten-1"
                :title="$t('additional:modules.tools.cosi.featuresList.distanceScoreChartTooltip')"
                @click.native="$emit('showDistanceScoresForSelected', selectedLayerList)"
            >
                <v-icon>mdi-radar</v-icon>
            </v-btn>
            <v-btn
                depressed
                :disabled="scoringIsOngoing || disableChartButtons"
                tile
                color="grey lighten-1"
                :title="$t('additional:modules.tools.cosi.featuresList.distanceScoreHistogramTooltip')"
                @click.native="$emit('showDistanceScoreHistogram', selectedLayerList)"
            >
                <v-icon>mdi-chart-histogram</v-icon>
            </v-btn>
            -->
        </v-card-actions>
        <Weights
            :is-visible="showWeightsDialog"
            :layer-list="selectedLayerList"
            @toggleWeightsDialog="toggleWeightsDialog"
        />
    </v-card>
</template>

<style lang="scss" scoped>
</style>
