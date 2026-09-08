<script>
import VueSlider from "vue-slider-component";
import "../node_modules/vue-slider-component/theme/default.css";

/**
 * RangeSlider is a wrapper for the "vue-3-slider-component" package,
 * see: https://www.npmjs.com/package/vue-3-slider-component
 */
export default {
    components: {
        VueSlider
    },
    props: {
        /**
         * v-model contains the selected from-to values as an array
         * Example: ["2024-q1", "Q2 / 2024"]
         */
        modelValue: {
            type: Array,
            required: true
        },
        /**
         * Dataset for the slider
         * Example: [{id: "2024-q1", name: "Q1 / 2024"},{id: "2024-q2", name: "Q2 / 2024"}]
         */
        data: {
            type: Array,
            required: true
        }
    },
    emits: ["update:modelValue"],
    data () {
        return {
            sliderProps: {
                dotSize: 16,
                enableCross: true,
                marks: false,
                hideLabel: true,
                adsorb: false,
                lazy: true
            }
        };
    },
    methods: {
        onChange (value) {
            this.$emit("update:modelValue", value);
        }
    }
};
</script>

<template>
    <div class="RangeSlider">
        <div class="slider-container">
            <VueSlider
                v-bind="sliderProps"
                :model-value="modelValue"
                :data="data"
                data-value="id"
                data-label="name"
                step="1"
                tooltip="always"
                @change="onChange"
            />

            <div class="endpoint-labels">
                <p class="endpoint-label">
                    {{ data[0]?.name ?? "" }}
                </p>

                <p class="endpoint-label">
                    {{ data[data.length - 1]?.name ?? "" }}
                </p>
            </div>
        </div>
    </div>
</template>

<style lang="scss" scoped>
div.RangeSlider {
    padding: 0 2.5rem;

    div.slider-container {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
        padding-top: 2rem;
    }

    div.endpoint-labels {
        display: flex;
        justify-content: space-between;
    }

    p.endpoint-label {
        margin: 0;
        font-size: 0.875rem;
    }

    :deep(div.vue-slider) {
        div.vue-slider-dot.vue-slider-dot-focus {
            z-index: 6;
        }

        div.vue-slider-dot:hover {
            z-index: 7;
        }

        div.vue-slider-process {
            background-color: $secondary;
        }

        .vue-slider-dot-tooltip-inner {
            background-color: $secondary;

            &:after {
                border-top-color: $secondary;
            }
        }

        span.vue-slider-dot-tooltip-text {
            color: #FFFFFF;
            line-height: 1.5;
            font-size: 0.875rem;
        }

        div.vue-slider-dot-handle {
            border: solid 0.1875rem $secondary;
            box-shadow: none;
        }

        div.vue-slider-mark-step {
            background: none;
        }
    }
}
</style>
