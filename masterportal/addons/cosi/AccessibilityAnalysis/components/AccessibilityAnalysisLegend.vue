<script>
import {VIcon} from "vuetify/components/VIcon";

export default {
    name: "AccessibilityAnalysisLegend",
    components: {
        VIcon
    },
    props: {
        steps: {
            type: Array,
            required: true
        },
        colors: {
            type: Array,
            required: true
        },
        unit: {
            type: String,
            required: true
        }
    }

};
</script>

<template lang="html">
    <div
        id="accessibility-analysis-legend"
        class="flex-fill"
    >
        <h6>
            {{ $t("additional:modules.tools.cosi.accessibilityAnalysis.legend") }}
        </h6>
        <template
            v-for="(step, index) in steps"
            :key="index"
        >
            <span
                v-if="index !== 3"
                class="me-4"
            >
                <v-icon
                    class="me-1"
                    :color="colors[index]"
                    small
                >
                    mdi-square-rounded
                </v-icon>
                <span
                    class="steps"
                >
                    {{ Math.round(step) }} {{ unit }}
                </span>
            </span>
            <span v-else>
                <v-icon
                    :color="colors[index]"
                    x-small
                >
                    mdi-minus-thick
                </v-icon>
                <v-icon
                    :color="colors[index]"
                    x-small
                >
                    mdi-minus-thick
                </v-icon>
                <v-icon
                    class="me-1"
                    :color="colors[index]"
                    x-small
                >
                    mdi-minus-thick
                </v-icon>
                <span
                    class="steps"
                >
                    {{ step }} {{ unit }} {{ $t("additional:modules.tools.cosi.accessibilityAnalysis.travelTimeIndex.atTravelTimeIndex") }} {{ $t("additional:modules.tools.cosi.accessibilityAnalysis.travelTimeIndex.travelTimeIndexBase") }}
                </span>
            </span>
        </template>
    </div>
</template>
