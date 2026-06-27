<script>
import AccordionItem from "../../../../src/shared/modules/accordion/components/AccordionItem.vue";
import {mapActions} from "vuex";
import LabeledSlider from "../../shared/modules/slider/components/LabeledSlider.vue";
import travelTimeIndex from "../assets/inrix_traveltimeindex_2021.json";

export default {
    name: "AccessibilityAnalysisTrafficFlow",
    components: {
        AccordionItem,
        LabeledSlider
    },
    props: {
        travelTime: {
            type: String,
            default: "9"
        }
    },
    emits: ["update:travelTime"],
    data () {
        return {
            travelTimeIndex
        };
    },
    methods: {
        ...mapActions("Alerting", ["addSingleAlert", "cleanup"]),
        showInfo () {
            this.addSingleAlert({
                category: "Info",
                displayClass: "info",
                content: this.$t("additional:modules.tools.cosi.accessibilityAnalysis.travelTimeIndex.help")
            });
        }
    }
};
</script>

<template lang="html">
    <AccordionItem
        id="trafficFlowInformation"
        icon="bi bi-info-circle"
        :title="'Information'"
    >
        <p
            class="cta"
            v-html="$t('additional:modules.tools.cosi.accessibilityAnalysis.travelTimeIndex.help')"
        />
    </AccordionItem>
    <div class="mb-3">
        <LabeledSlider
            :min="0"
            :max="23"
            :model-value="travelTime"
            unit="Uhr"
            @update:model-value="val => $emit('update:travelTime', val)"
        />
        <div class="d-flex justify-content-center value">
            <span
                id="exampleFormControlInput1"
                class="fs-5 pt-1"
            >
                {{ travelTimeIndex[travelTime] }}
            </span>
        </div>
        <div class="d-flex justify-content-center">
            <span>{{ $t('additional:modules.tools.cosi.accessibilityAnalysis.travelTimeIndex.title') }}</span>
        </div>
    </div>
</template>

<style lang="scss">
    #exampleFormControlInput1 {
        width: 8ch;
        text-align: center;
        color: $secondary;
        font-family: $font_family_accent;
    }
</style>
