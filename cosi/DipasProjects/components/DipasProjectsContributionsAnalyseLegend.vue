<script>
import LabeledSlider from "../../shared/modules/slider/components/LabeledSlider.vue";

export default {
    name: "DipasProjectsContributionsAnalyseLegend",
    components: {
        LabeledSlider
    },
    inject: ["votingClassificationThresholds", "votingLegend"],
    props: {
        isPointAnalyseActive: {
            type: Boolean,
            required: true
        },
        isHeatmapActive: {
            type: Boolean,
            required: true
        }
    },
    data () {
        return {
            votingSizeRanges: [
                {
                    name: this.votingClassificationThresholds[0] + " - " + this.votingClassificationThresholds[1],
                    size: "12px"
                },
                {
                    name: (this.votingClassificationThresholds[1] + 1) + " - " + this.votingClassificationThresholds[2],
                    size: "18px"
                },
                {
                    name: "mehr als " + this.votingClassificationThresholds[2],
                    size: "24px"
                }
            ],
            heatmapOpacity: 100
        };
    },

    methods: {
        /**
         * Updates the heatmap layer opacity when the transparency value changes.
         * @param {Number} value - The opacity percentage value from the slider.
         * @returns {void}
         */
        updateHeatmapOpacity (value) {
            this.heatmapOpacity = value;
            this.$emit("update:heatmap-opacity", value);
        }
    }
};
</script>

<template>
    <h5
        v-if="isPointAnalyseActive || isHeatmapActive"
        class="mb-3"
    >
        {{ $t("additional:modules.tools.cosi.dipasProjects.contributionsAnalyse.legend") }}
    </h5>
    <div
        v-if="isPointAnalyseActive"
        class="row g-2 align-items-start"
    >
        <div class="col-md-6">
            <div class="d-flex flex-column gap-3">
                <div
                    v-for="item in votingLegend"
                    :key="item.id"
                    class="d-flex align-items-center gap-2"
                >
                    <span
                        class="d-inline-block rounded-circle legend-icon-size legend-icon-border"
                        :style="{ background: item.color }"
                    />
                    <span>{{ item.text }}</span>
                </div>
            </div>
        </div>
        <div class="col-md-6">
            <div class="d-flex flex-column gap-3">
                <div
                    v-for="item in votingSizeRanges"
                    :key="item.name"
                    class="d-flex align-items-center gap-2"
                >
                    <span
                        class="d-inline-block rounded-circle bg-transparent legend-icon-border"
                        :style="{ width: item.size, height: item.size }"
                    />
                    <span>{{ item.name }}</span>
                </div>
            </div>
        </div>
    </div>
    <div v-if="isHeatmapActive">
        <div class="legend-gradient" />
        <div class="d-flex justify-content-between mt-1">
            <span>{{ votingClassificationThresholds[0] }}</span>
            <span>{{ votingClassificationThresholds[1] }}</span>
            <span>{{ votingClassificationThresholds[2] }}</span>
            <span>{{ votingClassificationThresholds[3] }}</span>
        </div>
        <div class="pt-4">
            <h5>
                {{ $t("additional:modules.tools.cosi.dipasProjects.transparency") }}
            </h5>
            <LabeledSlider
                class="mb-3"
                :min="0"
                :max="100"
                :unit="'%'"
                :model-value="heatmapOpacity"
                @update:model-value="updateHeatmapOpacity"
            />
        </div>
    </div>
</template>

<style lang="scss" scoped>
    .legend-icon-border {
        border-width: 1px;
        border-color: #000 !important;
        border-style: solid;
    }
    .legend-icon-size {
        width: 16px;
        height: 16px;
    }

    .legend-gradient {
        height: 15px;
        width: 100%;
        border-radius: 15px;
        background: linear-gradient(
            to right,
            rgba(0,0,255,0),
            blue 20%,
            cyan 40%,
            lime 60%,
            yellow 80%,
            red 100%
        );
    }
</style>
