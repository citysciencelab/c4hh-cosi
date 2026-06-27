<script>
import SpinnerItem from "../../../src/shared/modules/spinner/components/SpinnerItem.vue";

export default {
    name: "FloodRiskManagementSwitcher",
    components: {
        SpinnerItem
    },
    props: {
        buttons: {
            type: Array,
            required: true
        },
        group: {
            type: String,
            required: true
        },
        selectedValue: {
            type: String,
            required: false,
            default: undefined
        },
        subText: {
            type: Array,
            required: false,
            default: undefined
        }
    },
    emits: ["setSelectedElement"],
    data () {
        return {
            showLoadSpinner: false
        };
    },
    watch: {
        /**
         * Watcher for setting the loading spinner.
         * @returns {void}
         */
        selectedValue () {
            this.showLoadSpinner = true;

            setTimeout(() => {
                this.showLoadSpinner = false;
            }, 1000);
        }
    }
};
</script>
<template>
    <div class="switchRadioButtons mt-0">
        <div
            class="btn-group"
            role="group"
            aria-label="First group"
        >
            <div
                v-for="(button, idx) in buttons"
                :key="idx"
                class="button-wrapper"
            >
                <input
                    :id="`btnradio${idx}${button}`"
                    type="radio"
                    class="btn-check"
                    :name="group"
                    autocomplete="off"
                    :checked="button === selectedValue"
                >
                <label
                    class="btn text-nowrap px-3 py-2"
                    :for="`btnradio${idx}${button}`"
                    role="button"
                    tabindex="0"
                    @click="$emit('setSelectedElement', button)"
                    @keydown="$emit('setSelectedElement', button)"
                >
                    {{ button }}
                    <span
                        v-if="subText"
                        class="subtext"
                    >
                        {{ subText[idx] }}
                    </span>
                    <span
                        v-if="showLoadSpinner && selectedValue === button"
                        class="loading"
                    >
                        <SpinnerItem />
                    </span>
                </label>
            </div>
        </div>
    </div>
</template>

<style lang="scss" scoped>

.btn {
    border-radius: 0px;
    background-color: $light_grey;
    color: $light_grey_inactive_contrast;

    .subtext {
        display: block;
        font-size: 10px;
    }
}

.btn-check:checked + .btn {
    background: $secondary;
    color: $white;
    border-color: $secondary;
    position: relative;

    .loading {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(255, 255, 255, 0.3);
        text-align: center;
        align-content: center;
    }
}

.btn:hover {
    background: $primary;
    border-color: $primary;
}

.button-wrapper {
    &:first-child {
        .btn {
            border-top-left-radius: 20px;
            border-bottom-left-radius: 20px;
        }
    }
    &:last-child {
        .btn {
            border-top-right-radius: 20px;
            border-bottom-right-radius: 20px;
        }
    }
}
</style>
