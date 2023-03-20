<script>
import dayjs from "dayjs";
import isoWeek from "dayjs/plugin/isoWeek";
import advancedFormat from "dayjs/plugin/advancedFormat";
import customParseFormat from "dayjs/plugin/customParseFormat";
import weekday from "dayjs/plugin/weekday";
import TrafficCountDatePickerInput from "./TrafficCountDatePickerInput.vue";
import TrafficCountDatePickerWeek from "./TrafficCountDatePickerWeek.vue";

dayjs.extend(advancedFormat);
dayjs.extend(customParseFormat);
dayjs.extend(isoWeek);
dayjs.extend(weekday);


export default {
    name: "TrafficCountDatePicker",
    components: {
        TrafficCountDatePickerInput,
        TrafficCountDatePickerWeek
    },
    props: {
        format: {
            type: String,
            required: false,
            default: "YYYY-MM-DD"
        },
        type: {
            type: String,
            required: false,
            default: "week"
        },
        showWeekNumber: {
            type: Boolean,
            required: false,
            default: false
        },
        inputDelimiter: {
            type: String,
            required: false,
            default: ","
        },
        initialDates: {
            type: Array,
            required: false,
            default: () => []
        },
        maxSelection: {
            type: Number,
            required: false,
            default: 5
        },
        minDate: {
            type: String,
            required: false,
            default: ""
        },
        maxDate: {
            type: String,
            required: false,
            default: ""
        }
    },
    data () {
        return {
            selectedDates: [],
            inputDates: [],
            isCalendarVisible: false
        };
    },
    watch: {
        inputDates (newValue) {
            this.$emit("change", newValue);
        }
    },
    mounted () {
        this.initialDates.forEach(date => {
            if (date.includes("KW")) {
                if (dayjs().weekday() === 0) {
                    this.toggleSelectedDate(dayjs(date, "gggg [KW] ww").subtract(7, "day"));
                }
                else {
                    this.toggleSelectedDate(dayjs(date, "gggg [KW] ww"));
                }
            }
            else {
                this.toggleSelectedDate(dayjs(date, this.format));
            }
        });
    },
    created () {
        window.addEventListener("click", this.clickOutsideHandler);
        this.$once("hook:destroyed", () => {
            window.removeEventListener("click", this.clickOutsideHandler);
        });
    },
    methods: {
        /**
         * Handler for click outside event.
         * @param {Event} e The event.
         * @returns {void}
         */
        clickOutsideHandler (e) {
            if (this.isCalendarVisible && !this.$el.contains(e.target)) {
                this.isCalendarVisible = false;
            }
        },
        /**
         * Triggered when a date picker calendar date is clicked.
         * @param {Object} momentDate A dayjs instance of this date.
         * @returns {void}
         */
        toggleSelectedDate (momentDate) {
            if (this.type === "week") {
                this.toggleSelectedDateWeek(momentDate);
            }
        },
        /**
         * Toggles the week of the given date.
         * @param {Object} momentDate A dayjs instance of this date.
         * @returns {Boolean} true if the toggle was successful, false if not.
         */
        toggleSelectedDateWeek (momentDate) {
            if (typeof momentDate?.format !== "function" || !Array.isArray(this.selectedDates)) {
                return false;
            }

            const dayPointer = dayjs(momentDate);

            this.toggleWeek(dayPointer);
            if (typeof this.maxSelection === "number") {
                while (this.selectedDates.length > this.maxSelection * 7) {
                    this.selectedDates.shift();
                }
            }
            this.inputDates = [];
            for (let i = 0; i < this.selectedDates.length; i++) {
                this.inputDates.push(dayjs(this.selectedDates[i], "YYYY-MM-DD").format(this.format));
                i += 6;
            }
            return true;
        },
        /**
         * Toggles the dates for a whole week based on given date.
         * @param {Object} momentDate The dayjs date.
         * @returns {void}
         */
        toggleWeek (momentDate) {
            let dayPointer = dayjs(momentDate);

            dayPointer = dayPointer.startOf("isoWeek");
            for (let i = 0; i < 7; i++) {
                this.toggleSelectedDateDay(dayPointer);
                dayPointer = dayPointer.add(1, "day");
            }
        },
        /**
         * Toggles the day of the given date.
         * @param {Object} momentDate A dayjs instance of this date.
         * @returns {Boolean} true if the toggle was successful, false if not.
         */
        toggleSelectedDateDay (momentDate) {
            if (typeof momentDate?.format !== "function" || !Array.isArray(this.selectedDates)) {
                return false;
            }
            const dateStr = momentDate.format("YYYY-MM-DD"),
                idx = this.selectedDates.indexOf(dateStr);

            if (idx === -1) {
                this.selectedDates.push(dateStr);
            }
            else {
                this.selectedDates.splice(idx, 1);
            }
            return true;
        },
        /**
         * Toggles the visibility of the calendar.
         * @returns {void}
         */
        toggleCalendar () {
            this.isCalendarVisible = !this.isCalendarVisible;
        },
        /**
         * Resets selectedDates and inputDates.
         * @returns {void}
         */
        clearSelectedDates () {
            this.selectedDates = [];
            this.inputDates = [];
        }
    }
};
</script>

<template lang="html">
    <div class="datePickerContainer">
        <TrafficCountDatePickerInput
            :input-dates="inputDates"
            :delimiter="inputDelimiter"
            @toggleCalendar="toggleCalendar"
            @clearInput="clearSelectedDates"
        />
        <TrafficCountDatePickerWeek
            v-if="isCalendarVisible"
            :show-week-number="showWeekNumber"
            :selected-dates="selectedDates"
            :min-date="minDate"
            :max-date="maxDate"
            @toggleSelectedDate="toggleSelectedDate"
        >
            <template #currentSwitch="{momentDate}">
                <slot
                    name="currentSwitch"
                    :moment-date="momentDate"
                />
            </template>
            <template #weekdayName="{weekdayName}">
                <slot
                    name="weekdayName"
                    :weekday-name="weekdayName"
                />
            </template>
            <template #weekNumber="{weekNumber}">
                <slot
                    name="weekNumber"
                    :week-number="weekNumber"
                />
            </template>
            <template #dateField="{day, momentDate, selected, inCurrentMonth, disabled}">
                <slot
                    name="dateField"
                    :day="day"
                    :moment-date="momentDate"
                    :selected="selected"
                    :in-current-month="inCurrentMonth"
                    :disabled="disabled"
                />
            </template>
        </TrafficCountDatePickerWeek>
    </div>
</template>

<style lang="scss" scoped>
    @import "~/css/mixins.scss";
    @import "~variables";

</style>

<style lang="scss">
@import "~/css/mixins.scss";
@import "~variables";

.mx-datepicker-main {
    color: $secondary_contrast;
    font-family: "HamburgSans";
}

.mx-btn {
    color: #337ab7;
    &:hover {
        color: $dark_blue;
    }
}

.mx-calendar-content {
    .cell{
        &.active {
            background: $dark_blue;
        }
        &:not(.disabled) {
            &:hover {
                color: #ffffff;
                background: $dark_blue;
            }
        }
    }
}

.mx-input-wrapper {
    input {
        display: block;
        width: 100%;
        padding: 0.375rem 0.75rem;
        font-size: 12px;
        font-weight: 400;
        line-height: 1.5;
        color: #212529;
        background-color: #ffffff;
        background-clip: padding-box;
        border: 1px solid #ced4da;
        appearance: none;
        border-radius: 0;
        box-shadow: inset 0 1px 2px rgb(0 0 0 / 8%);
        transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
        &:hover, &:focus {
            color: $black;
            background-color: $white;
            border-color: $light_blue;
            outline: 0;
            box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.08), 0 0 0 0.25rem rgba(0, 48, 99, 0.25);
        }
    }
}

</style>
