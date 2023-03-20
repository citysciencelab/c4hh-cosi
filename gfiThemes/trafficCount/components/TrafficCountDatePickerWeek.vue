<script>
import dayjs from "dayjs";
import TrafficCountDatePickerSwitcher from "./TrafficCountDatePickerSwitcher.vue";
import TrafficCountDatePickerCalendar from "./TrafficCountDatePickerCalendar.vue";

export default {
    name: "TrafficCountDatePickerWeek",
    components: {
        TrafficCountDatePickerSwitcher,
        TrafficCountDatePickerCalendar
    },
    props: {
        showWeekNumber: {
            type: Boolean,
            required: false,
            default: false
        },
        selectedDates: {
            type: Array,
            required: false,
            default: () => []
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
            currentSwitch: dayjs().format("YYYY-MM")
        };
    },
    methods: {
        /**
         * Triggers the toggleSelectedDate event.
         * @param {Object} date A dayjs object of the clicked date.
         * @returns {void}
         */
        toggleSelectedDate (date) {
            this.$emit("toggleSelectedDate", date);
        },
        /**
         * Decrements the year.
         * @returns {void}
         */
        yearDown () {
            let momentDate = dayjs(this.currentSwitch, "YYYY-MM");

            momentDate = momentDate.subtract(1, "year");
            this.currentSwitch = momentDate.format("YYYY-MM");
        },
        /**
         * Increments the year.
         * @returns {void}
         */
        yearUp () {
            let momentDate = dayjs(this.currentSwitch, "YYYY-MM");

            momentDate = momentDate.add(1, "year");
            this.currentSwitch = momentDate.format("YYYY-MM");
        },
        /**
         * Decrements the month.
         * @returns {void}
         */
        monthDown () {
            let momentDate = dayjs(this.currentSwitch, "YYYY-MM");

            momentDate = momentDate.subtract(1, "month");
            this.currentSwitch = momentDate.format("YYYY-MM");
        },
        /**
         * Increments the month.
         * @returns {void}
         */
        monthUp () {
            let momentDate = dayjs(this.currentSwitch, "YYYY-MM");

            momentDate = momentDate.add(1, "month");
            this.currentSwitch = momentDate.format("YYYY-MM");
        }
    }
};
</script>

<template>
    <div class="datePickerWeek">
        <TrafficCountDatePickerSwitcher
            :current-switch="currentSwitch"
            :show-month-selector="true"
            current-switch-format="YYYY-MM"
            @yearDown="yearDown"
            @yearUp="yearUp"
            @monthDown="monthDown"
            @monthUp="monthUp"
        >
            <template #currentSwitch="{momentDate}">
                <slot
                    name="currentSwitch"
                    :moment-date="momentDate"
                />
            </template>
        </TrafficCountDatePickerSwitcher>
        <TrafficCountDatePickerCalendar
            :current-switch="currentSwitch"
            :selected-dates="selectedDates"
            :show-week-number="showWeekNumber"
            :max-date="maxDate"
            :min-date="minDate"
            @onClick="toggleSelectedDate"
        >
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
        </TrafficCountDatePickerCalendar>
    </div>
</template>

<style scoped lang="scss">
.datePickerWeek {
    position: absolute;
    right: 34px;
    background-color: white;
    z-index: 100;
    border: thin grey;
    box-shadow: 0 6px 12px rgb(0 0 0 / 18%);
}
</style>
