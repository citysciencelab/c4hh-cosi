<script>
import AccordionItem from "@shared/modules/accordion/components/AccordionItem.vue";
import AlertMessage from "../../shared/modules/alerts/components/AlertMessage.vue";
import DipasProjectsContributionsAnalyseLegend from "./DipasProjectsContributionsAnalyseLegend.vue";
import {getLayerById} from "../../utils/layer/getLayerById.js";
import Heatmap from "ol/layer/Heatmap";

import SwitchInput from "@shared/modules/checkboxes/components/SwitchInput.vue";

export default {
    name: "DipasProjectsContributionsAnalyse",
    components: {
        AccordionItem,
        AlertMessage,
        DipasProjectsContributionsAnalyseLegend,
        SwitchInput
    },
    props: {
        isPointAnalyseActive: {
            type: Boolean,
            required: true
        },
        selectedCategories: {
            type: Array,
            required: true
        }
    },
    data () {
        return {
            heatmapLayer: null,
            isHeatmapActive: false
        };
    },
    computed: {
        /**
         * Checks whether the project contains any voting data.
         * @returns {Boolean} True if at least one contribution has votes, otherwise false.
         */
        hasVotingData () {
            if (!this.heatmapLayer) {
                return false;
            }
            return this.heatmapLayer.getSource().getFeatures().some(feature => {
                return (
                    Number(feature.get("votingPro")) +
                    Number(feature.get("votingContra"))
                ) > 0;
            });
        },

        /**
         * Calculates the maximum number of total votes (pro + contra) across all features.
         * @returns {Number} The maximum total votes, minimum 1.
         */
        maxVotes () {
            return Math.max(
                ...this.heatmapLayer.getSource().getFeatures().map(feature => {
                    return (
                        Number(feature.get("votingPro")) +
                        Number(feature.get("votingContra"))
                    );
                }),
                1
            );
        }
    },
    mounted () {
        if (!this.heatmapLayer) {
            this.createHeatmapLayer();
        }
    },
    unmounted () {
        if (this.heatmapLayer) {
            mapCollection.getMap("2D").removeLayer(this.heatmapLayer);
        }
    },
    methods: {
        /**
         * Creates a heatmap layer for the contributions and adds it to the map.
         * @returns {void}
         */
        createHeatmapLayer () {
            this.heatmapLayer = new Heatmap({
                id: "dipas-contributions-heatmap",
                source: getLayerById("dipas-contributions").getLayer().getSource(),
                radius: 40,
                blur: 20,
                weight: this.getFeatureWeight
            });
            this.heatmapLayer.setZIndex(9999);
            mapCollection.getMap("2D").addLayer(this.heatmapLayer);
            this.heatmapLayer.setVisible(false);
        },

        /**
         * Calculates the weight of a feature for the heatmap based on its votes.
         * @param {ol/Feature} feature - The feature to calculate the weight for.
         * @returns {Number} The weight value between 0 and 1.
         */
        getFeatureWeight (feature) {
            if (!this.selectedCategories.includes(feature.get("category"))) {
                return 0;
            }

            return (
                Number(feature.get("votingPro")) +
                Number(feature.get("votingContra"))
            ) / this.maxVotes;
        },

        /**
         * Toggles the visibility of the heatmap layer.
         * @param {Event} event - The change event from the heatmap switch input.
         * @returns {void}
         */
        toggleHeatmap (event) {
            this.heatmapLayer.setVisible(event.target.checked);
            this.isHeatmapActive = event.target.checked;
        },

        /**
         * Toggles the point analysis mode and emits an event to notify the parent component.
         * @returns {void}
         */
        togglePointAnalyse () {
            this.$emit("toggle:is-point-analyse-active");
        },

        /**
         * Sets the heatmap layer opacity when the transparency value changes.
         * @param {Number} value - The opacity percentage value from the slider.
         * @returns {void}
         */
        setHeatmapOpacity (value) {
            this.heatmapLayer.setOpacity(value / 100);
        }
    }
};
</script>

<template>
    <AccordionItem
        :id="'dipas-contributions-analyse'"
        icon="bi bi-clipboard2-data"
        class="ps-3"
        :title="$t('additional:modules.tools.cosi.dipasProjects.contributionsAnalyse.label')"
    >
        <AlertMessage
            v-if="!hasVotingData"
            :text="$t('additional:modules.tools.cosi.dipasProjects.noContributionsRatings')"
            type="noData"
        />
        <SwitchInput
            id="heatmap"
            :aria="$t('additional:modules.tools.cosi.dipasProjects.showHeatmap')"
            :checked="isHeatmapActive"
            :disabled="!hasVotingData"
            :interaction="toggleHeatmap"
            :label="$t('additional:modules.tools.cosi.dipasProjects.showHeatmap')"
            class="mb-3"
        />
        <DipasProjectsContributionsAnalyseLegend
            :is-point-analyse-active="false"
            :is-heatmap-active="isHeatmapActive"
            @update:heatmap-opacity="setHeatmapOpacity"
        />
        <SwitchInput
            :id="'dipas-contributions-point-analyse'"
            :label="$t('additional:modules.tools.cosi.dipasProjects.contributionsAnalyse.labelPointAnalyse')"
            :aria="$t('additional:modules.tools.cosi.dipasProjects.contributionsAnalyse.labelPointAnalyse')"
            :checked="isPointAnalyseActive"
            :disabled="!hasVotingData"
            :interaction="togglePointAnalyse"
            class="mb-3"
        />
        <DipasProjectsContributionsAnalyseLegend
            :is-point-analyse-active="isPointAnalyseActive"
            :is-heatmap-active="false"
        />
    </AccordionItem>
</template>
