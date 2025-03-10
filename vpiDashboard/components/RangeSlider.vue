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
        },
        /**
         * Timeout for change event
         */
        changeEventTimeout: {
            type: Number,
            required: false,
            default: 750
        },
        /**
         * Title shown below the slider
         */
        sliderTitle: {
            type: String,
            default: null
        }
    },
    emits: [
        "update:modelValue",
        "change"
    ],
    data () {
        return {
            sliderTimeoutReference: null,
            sliderProps: {
                dotSize: 16,
                enableCross: true,
                marks: true,
                hideLabel: true,
                adsorb: false
            }
        };
    },
    watch: {
        /** Watch modelValue. If empty, set default range from first and last data item. Only done once! */
        modelValue: {
            immediate: true,
            handler (value) {
                if (value.length) {
                    return;
                }

                if (this.data.length) {
                    this.$emit("update:modelValue", [
                        this.data[0].id,
                        this.data[this.data.length - 1].id
                    ]);
                }
            }
        }
    },
    methods: {
        onChange (event) {
            this.$emit("update:modelValue", event);

            window.clearTimeout(this.sliderTimeoutReference);
            this.sliderTimeoutReference = window.setTimeout(async () => {
                this.$emit("change", event);
            }, this.changeEventTimeout);
        }
    }
};
</script>

<template>
    <div class="RangeSlider">
        <VueSlider
            v-bind="sliderProps"
            :model-value="modelValue"
            :data="data"
            data-value="id"
            data-label="name"
            @change="onChange"
        />

        <span
            v-if="sliderTitle"
            class="title"
        >
            {{ sliderTitle }}
        </span>
    </div>
</template>

<style lang="scss">
div.RangeSlider {
    span.title {
        display: block;
        text-align: center;
        font-weight: 400;
        font-size: 0.875rem;
        line-height: 1.5;
        color: #212529;
    }

    div.vue-slider {
        div.vue-slider-process {
            background-color: #003063;
        }

        .vue-slider-dot-tooltip-inner {
            background-color: #003063;

            &:after {
                border-top-color: #003063;
            }
        }

        span.vue-slider-dot-tooltip-text {
            color: #FFFFFF;
        }

        div.vue-slider-mark-active {
            div.vue-slider-mark-step {
                background-color: rgba(#a1befd, 0.7);
            }
        }

        div.vue-slider-dot-handle {
            border: solid 0.1875rem #003063;
            box-shadow: none;
        }
    }
}
</style>
