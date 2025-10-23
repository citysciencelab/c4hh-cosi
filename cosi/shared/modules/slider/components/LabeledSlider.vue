<script>
import SliderItem from "@shared/modules/slider/components/SliderItem.vue";
import {uniqueId} from "@shared/js/utils/uniqueId";

export default {
    name: "LabeledSlider",
    components: {
        SliderItem
    },
    props: {
        label: {
            type: String,
            default: ""
        },
        max: {
            type: Number,
            default: 100
        },
        min: {
            type: Number,
            default: 0
        },
        modelValue: {
            type: [String, Number],
            default: 0
        },
        unit: {
            type: String,
            default: ""
        }
    },
    emits: ["update:model-value"],
    data () {
        return {
            inputId: uniqueId(),
            sliderId: uniqueId()
        };
    }
};
</script>

<template lang="html">
    <div>
        <div class="d-flex justify-content-between mb-2 align-items-center highlighted">
            <div class="col">
                <span class="ms-3">{{ label }}</span>
            </div>
            <input
                :id="inputId"
                type="number"
                class="form-control fs-5 shadow col-1 highlighted"
                :value="modelValue"
                @input="$emit('update:model-value', $event.target.value)"
            >
            <div class="col">
                <span class="ms-1">{{ unit }}</span>
            </div>
        </div>
        <SliderItem
            :id="sliderId"
            :aria="`Slider for ${label}`"
            class="mb-1"
            :value="modelValue"
            :min="min"
            :max="max"
            :interaction="event => $emit('update:model-value', event.target.value)"
        />
        <div class="d-flex justify-content-between value">
            <span>{{ min }} {{ unit }}</span>
            <span>{{ max }} {{ unit }}</span>
        </div>
    </div>
</template>

<style lang="scss" scoped>

.highlighted {
    color: $secondary;
    font-family: $font_family_accent;
}

input {
    width: 8ch;
    text-align: right;
}
/* Hide spin buttons in number inputs (Chrome, Safari, Edge) */
input[type="number"]::-webkit-outer-spin-button,
input[type="number"]::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
}

/* Hide spin buttons in Firefox */
input[type="number"] {
    -moz-appearance: textfield;
}
</style>
