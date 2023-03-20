<script>
export default {
    name: "SimpleSlider",
    props: {
        id: {
            type: String,
            default: "simple-slider"
        },
        value: {
            type: Number,
            default: 0
        },
        min: {
            type: Number,
            default: 0
        },
        max: {
            type: Number,
            default: 100
        },
        step: {
            type: Number,
            default: 1
        },
        disabled: {
            type: Boolean,
            default: false
        },
        unitLabel: {
            type: String,
            default: ""
        },
        unitPosition: {
            type: String,
            default: undefined
        },
        locale: {
            type: String,
            default: "de-DE"
        }
    },
    computed: {
        _value () {
            return this.value;
        },
        _unitPos () {
            return this.unitPosition ? "float-" + this.unitPosition : "";
        }
    },
    methods: {
        _input (evt) {
            this.$emit("input", parseFloat(evt.target.value));
        }
    }
};
</script>

<template>
    <div
        :id="id"
    >
        <label
            :for="id + '-slider'"
            class="slider-label"
        >
            <input
                :id="id + '-number'"
                ref="input-number"
                type="number"
                :value="_value"
                :disabled="disabled"
                :min="min"
                :max="max"
                @input="_input"
            >
            <small :class="_unitPos">
                {{ unitLabel }}
            </small>
        </label>
        <input
            :id="id + '-slider'"
            ref="input-slider"
            type="range"
            :title="_value.toLocaleString(locale)"
            :value="_value"
            :disabled="disabled"
            :min="min"
            :max="max"
            :step="step"
            @input="_input"
        >
        <div>
            <small class="float-left">
                {{ min.toLocaleString(locale) }}
            </small>
            <small class="float-right">
                {{ max.toLocaleString(locale) }}
            </small>
        </div>
        <slot />
    </div>
</template>

<style lang="scss" scoped>
    .slider-label {
        width: 100%;
    }
</style>
