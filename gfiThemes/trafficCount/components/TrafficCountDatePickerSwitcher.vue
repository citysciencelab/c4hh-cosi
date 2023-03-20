<script>
import dayjs from "dayjs";

export default {
    name: "TrafficCountDatePickerSwitcher",
    props: {
        currentSwitch: {
            type: String,
            required: true
        },
        currentSwitchFormat: {
            type: String,
            required: true
        }
    },
    computed: {
        currentSwitchMoment () {
            return dayjs(this.currentSwitch, this.currentSwitchFormat);
        }
    },
    methods: {
        /**
         * Emits the "yearDown" event.
         * @returns {void}
         */
        yearDown () {
            this.$emit("yearDown");
        },
        /**
         * Emits the "yearUp" event.
         * @returns {void}
         */
        yearUp () {
            this.$emit("yearUp");
        },
        /**
         * Emits the "monthDown" event.
         * @returns {void}
         */
        monthDown () {
            this.$emit("monthDown");
        },
        /**
         * Emits the "monthUp" event.
         * @returns {void}
         */
        monthUp () {
            this.$emit("monthUp");
        }
    }
};
</script>

<template>
    <div
        id="date-picker-switcher"
        class="text-center py-2"
    >
        <button
            type="button"
            class="btn btn-light btn-sm float-start"
            @click="yearDown"
        >
            <i class="bi bi-chevron-double-left" />
        </button>
        <button
            type="button"
            class="btn btn-light btn-sm float-start"
            @click="monthDown"
        >
            <i class="bi bi-chevron-left" />
        </button>
        <button
            type="button"
            class="btn btn-light btn-sm float-end"
            @click="yearUp"
        >
            <i class="bi bi-chevron-double-right" />
        </button>
        <button
            type="button"
            class="btn btn-light btn-sm float-end"
            @click="monthUp"
        >
            <i class="bi bi-chevron-right" />
        </button>
        <span class="date-label">
            <slot
                name="currentSwitch"
                :moment-date="currentSwitchMoment"
            >
                {{ currentSwitch }}
            </slot>
        </span>
    </div>
</template>

<style scoped lang="scss">
    @import "~variables";

    #date-picker-switcher {
        button {
            border: 0;
            box-shadow: none;
            background: none;
            color: #337ab7;
            &:hover {
                color: $dark_blue;
            }
        }
        .date-label {
            font-family: $font_family_default;
            font-size: $font_size_big;
        }
    }
</style>
