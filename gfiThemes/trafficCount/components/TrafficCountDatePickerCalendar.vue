<script>
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import advancedFormat from "dayjs/plugin/advancedFormat";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import isoWeek from "dayjs/plugin/isoWeek";

dayjs.extend(customParseFormat);
dayjs.extend(advancedFormat);
dayjs.extend(isSameOrBefore);
dayjs.extend(isoWeek);

export default {
    name: "TrafficCountDatePickerCalendar",
    props: {
        currentSwitch: {
            type: String,
            required: false,
            default: ""
        },
        selectedDates: {
            type: Array,
            required: false,
            default () {
                return [];
            }
        },
        showWeekNumber: {
            type: Boolean,
            required: false,
            default: false
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
            currentDates: []
        };
    },
    computed: {
        namesOfWeekdaysComputed () {
            const result = [],
                weekdays = this.$t("additional:modules.tools.gfi.themes.trafficCount.datepicker.weekdaysShort", {returnObjects: true});

            for (let i = 1; i <= 7; i++) {
                result.push(weekdays[i % 7]);
            }
            return result;
        }
    },
    watch: {
        currentSwitch (val) {
            this.currentDates = this.getCurrentDates(val, this.selectedDates);
        },
        selectedDates (val) {
            this.currentDates = this.getCurrentDates(this.currentSwitch, val);
        }
    },
    mounted () {
        this.currentDates = this.getCurrentDates(this.currentSwitch, this.selectedDates);
    },
    methods: {
        /**
         * Returns the current dates to build the template with.
         * @param {String} currentSwitch The current switch command to identify the month and the year.
         * @param {String[]} selectedDates An array of previous selected dates.
         * @returns {Object[]} An array of Objects to build the template with.
         */
        getCurrentDates (currentSwitch, selectedDates) {
            const result = [],
                currentMoment = dayjs(currentSwitch, "YYYY-MM", true),
                minMoment = dayjs(this.minDate, "YYYY-MM-DD"),
                maxMoment = dayjs(this.maxDate, "YYYY-MM-DD");

            let datePointer = currentMoment.isValid() ? dayjs(currentMoment) : dayjs(),
                endDate = null;

            endDate = dayjs(datePointer);
            datePointer = datePointer.startOf("isoWeek");
            endDate = endDate.startOf("isoWeek").add(41, "day");

            while (datePointer.isSameOrBefore(endDate)) {
                if (datePointer.isoWeekday() === 1) {
                    result.push({
                        weekNumber: datePointer.format("W"),
                        days: []
                    });
                }
                result[result.length - 1].days.push({
                    day: datePointer.format("D"),
                    momentDate: dayjs(datePointer),
                    selected: selectedDates.includes(datePointer.format("YYYY-MM-DD")),
                    inCurrentMonth: currentMoment.format("M") === datePointer.format("M"),
                    disabled: this.isDisabledDate(datePointer, minMoment, maxMoment)
                });
                datePointer = datePointer.add(1, "day");
            }
            return result;
        },
        /**
         * Emits on click.
         * @param {Object} momentDate A dayjs object of the clicked date.
         * @param {Boolean} disabled true if disabled, false if enabled.
         * @returns {void}
         */
        onClick (momentDate, disabled) {
            if (disabled) {
                return;
            }
            this.$emit("onClick", momentDate);
        },
        /**
         * Checks if the date should be disabled.
         * @param {Object} day The day as dayjs object.
         * @param {Object} minDate The min date as dayjs object.
         * @param {Object} maxDate The max date as dayjs object.
         * @returns {Boolean} true if date is not between minDate and maxDate, false if date is between.
         */
        isDisabledDate (day, minDate, maxDate) {
            if (typeof day?.isBefore !== "function" || typeof day?.isAfter !== "function") {
                return false;
            }
            return day.isBefore(minDate) || day.isAfter(maxDate);
        }
    }
};
</script>

<template lang="html">
    <div class="datePickerCalendarContainer">
        <table>
            <tr>
                <th v-if="showWeekNumber" />
                <th
                    v-for="(weekdayName, index) in namesOfWeekdaysComputed"
                    :key="'weekdayName-' + index"
                    class="weekdayName"
                >
                    <slot
                        name="weekdayName"
                        :weekday-name="weekdayName"
                    >
                        {{ weekdayName }}
                    </slot>
                </th>
            </tr>
            <tr
                v-for="dateRow in currentDates"
                :key="'dateRow-' + dateRow.weekNumber"
            >
                <td
                    v-if="showWeekNumber"
                    class="weekNumber"
                >
                    <slot
                        name="weekNumber"
                        :week-number="dateRow.weekNumber"
                    >
                        {{ dateRow.weekNumber }}
                    </slot>
                </td>
                <td
                    v-for="dateObj in dateRow.days"
                    :key="'dateObj-' + dateObj.day"
                    :class="{dateField: true, outOfMonth: !dateObj.inCurrentMonth, selected: dateObj.selected, disabled: dateObj.disabled}"
                    @click="onClick(dateObj.momentDate, dateObj.disabled)"
                    @keypress.enter="onClick(dateObj.momentDate, dateObj.disabled)"
                >
                    <slot
                        name="dateField"
                        :day="dateObj.day"
                        :moment-date="dateObj.momentDate"
                        :selected="dateObj.selected"
                        :in-current-month="dateObj.inCurrentMonth"
                        :disabled="dateObj.disabled"
                    >
                        {{ dateObj.day }}
                    </slot>
                </td>
            </tr>
        </table>
    </div>
</template>

<style lang="scss" scoped>
    @import "~/css/mixins.scss";
    @import "~variables";

    .datePickerCalendarContainer {
        td, th {
            width: 32px;
            height: 32px;
            text-align: center;
            vertical-align: middle;
        }
        th {
            font-weight: normal;
        }
        td {
            &.dateField {
                cursor: pointer;
            }
            &.outOfMonth {
                color: $light_grey;
            }
            &.disabled {
                color: #ccc;
                background-color: #f3f3f3;
                cursor: not-allowed;
            }
            &.selected {
                color: $white;
                background-color: $light_blue;
            }
            &.weekNumber {
                opacity: 0.5;
            }
        }
    }
</style>
