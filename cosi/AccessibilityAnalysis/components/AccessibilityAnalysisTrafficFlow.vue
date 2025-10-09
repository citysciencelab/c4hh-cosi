<script>
import AccordionItem from "../../../../src/shared/modules/accordion/components/AccordionItem.vue";
import {mapActions} from "vuex";
import SliderItem from "../../../../src/shared/modules/slider/components/SliderItem.vue";
import ToolInfo from "../../shared/modules/toolInfo/components/ToolInfo.vue";
import travelTimeIndex from "../assets/inrix_traveltimeindex_2021.json";

export default {
    name: "AccessibilityAnalysisTrafficFlow",
    components: {
        AccordionItem,
        SliderItem,
        ToolInfo
    },
    props: {
        time: {
            type: Number,
            default: 9
        }
    },
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
        },
        test2 (evt) {
            console.log(evt.target.value);
            this.$emit("update:time", evt.target.value);
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
        <ToolInfo
            :summary="$t('additional:modules.tools.cosi.accessibilityAnalysis.travelTimeIndex.help')"
        />
    </AccordionItem>
    <div class="mb-3">
        <div class="d-flex justify-content-center mb-1">
            <input class="form-control form-control-sm fs-5" id="exampleFormControlInput1" :value="time + ':00'" @input="test2($event)" max="23" min="0" readonly>
        </div>
        <SliderItem
            :id="'routing-slider-input'"
            aria="test"
            class="mb-1"
            :value="time"
            :min="0"
            :max="23"
            :disabled="disabled"
            :interaction="(evt) => test2(evt)"
        />
        <div class="d-flex justify-content-between value">
            <span>0</span>
            <span id="exampleFormControlInput1" class="fs-5 pt-1">{{ travelTimeIndex[time] }}</span>
            <span>23</span>
        </div>
        <div class="d-flex justify-content-center">
            <span>
            Reisezeitindex</span>
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
