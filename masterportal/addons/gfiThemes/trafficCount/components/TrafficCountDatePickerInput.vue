<script>

export default {
    name: "TrafficCountDatePickerInput",
    props: {
        inputDates: {
            type: Array,
            required: false,
            default: () => []
        },
        delimiter: {
            type: String,
            required: false,
            default: ","
        },
        placeholder: {
            type: String,
            required: false,
            default: "Datum"
        }
    },
    emits: ["clearInput", "toggleCalendar"],
    data () {
        return {
            showCalendarIcon: true
        };
    },
    computed: {
        dateComputed () {
            if (!Array.isArray(this.inputDates)) {
                return "";
            }
            return this.inputDates.join(this.delimiter);
        }
    },
    methods: {
        /**
         * Emits toggleCalendar.
         * @returns {void}
         */
        toggleCalendar () {
            this.$emit("toggleCalendar");
        },
        /**
         * Emits clearInput.
         * @returns {void}
         */
        clearInput () {
            this.$emit("clearInput");
        },
        /**
         * Sets the showCalendarIcon variable to given value.
         * @param {Boolean} value True if the calendar icon should be visible, false if not.
         * @returns {void}
         */
        setShowCalendarIcon (value) {
            this.showCalendarIcon = value;
        }
    }
};
</script>

<template>
    <div
        class="input-wrapper d-block w-100"
        role="button"
        tabindex="0"
        @mouseover="setShowCalendarIcon(false)"
        @focus="setShowCalendarIcon(false)"
        @mouseleave="setShowCalendarIcon(true)"
        @blur="setShowCalendarIcon(true)"
        @keypress.enter="toggleCalendar"
    >
        <div
            class="date-input form-control"
            role="button"
            tabindex="-1"
            @click="toggleCalendar"
            @keypress.enter="toggleCalendar"
        >
            <template v-if="dateComputed">
                {{ dateComputed }}
            </template>
            <span
                v-else
                class="wrap-input-placeholder"
            >
                {{ placeholder }}
            </span>
        </div>
        <i :class="['bi bi-calendar4 calendar', showCalendarIcon ? 'show': '']" />
        <i
            :class="['bi bi-x', !showCalendarIcon ? 'show': '']"
            role="button"
            tabindex="0"
            @click="clearInput"
            @keypress.enter="clearInput"
        />
    </div>
</template>

<style scoped lang="scss">

.input-wrapper {
    position: relative;

    .date-input {
        height: auto;
        min-height: calc(1.5em + 0.75rem + 2px);
        padding-right: 28px;
        white-space: normal;
        word-break: break-word;
        overflow-wrap: anywhere;
        cursor: pointer;
        color: $dark_grey;

        &:hover {
            border-color: $light_blue;
        }
    }
    .wrap-input-placeholder {
        color: $dark_grey;
    }
}

i {
    position: absolute;
    top: 50%;
    right: 8px;
    -webkit-transform: translateY(-50%);
    transform: translateY(-50%);
    font-size: 16px;
    line-height: 1;
    color: rgba(0,0,0,.5);
    vertical-align: middle;
    display: none;
}
.bi-x {
    cursor: pointer;
}
.show {
    display: inline-block;
}
</style>
