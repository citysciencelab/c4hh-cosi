<script>
import InputText from "../../../../../src/shared/modules/inputs/components/InputText.vue";
import SliderItem from "../../../../../src/shared/modules/slider/components/SliderItem.vue";
import SwitchInput from "../../../../../src/shared/modules/checkboxes/components/SwitchInput.vue";

export default {
    name: "DynamicInputByType",
    components: {
        InputText,
        SliderItem,
        SwitchInput
    },
    props: {
        aria: {
            type: String,
            default: ""
        },
        checked: {
            type: Boolean,
            default: false
        },
        id: {
            type: String,
            required: true
        },
        inputType: {
            type: String,
            default: "string"
        },
        label: {
            type: String,
            required: true
        },
        max: {
            type: Number,
            default: 100
        },
        min: {
            type: Number,
            default: 0
        },
        placeholder: {
            type: String,
            default: ""
        },
        step: {
            type: Number,
            default: 1
        },
        value: {
            type: [String, Number, Boolean],
            default: undefined,
            required: false
        }
    },
    emits: ["update:value", "update:checked"]
};
</script>

<template>
    <div>
        <template v-if="inputType === 'string'">
            <InputText
                :id="id"
                class="form-control mb-3"
                :label="label"
                :placeholder="placeholder"
                :model-value="value"
                @update:modelValue="$emit('update:value', $event)"
            />
        </template>
        <template v-else-if="inputType === 'boolean'">
            <div class="form-switch">
                <SwitchInput
                    :id="id"
                    :label="label"
                    :aria="aria"
                    :checked="checked"
                    :interaction="(event) => $emit('update:checked', event.target.checked)"
                />
            </div>
        </template>
        <template v-else-if="inputType === 'number' || inputType === 'integer'">
            <label :for="id">
                {{ label }}
            </label>
            <div class="d-flex justify-content-between value">
                <span>{{ min }}</span>
                <span><b>{{ value }}</b></span>
                <span>{{ max }}</span>
            </div>
            <SliderItem
                :id="id"
                :aria="aria"
                :class-array="['mb-3']"
                :min="min"
                :max="max"
                :step="step"
                :value="value"
                :interaction="($event) => $emit('update:value', Number($event.target.value))"
            />
        </template>
    </div>
</template>
