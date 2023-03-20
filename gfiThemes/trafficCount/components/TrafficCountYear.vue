<script>
import TrafficCountCompDiagram from "./TrafficCountCompDiagram.vue";
import TrafficCountCompTable from "./TrafficCountCompTable.vue";
import TrafficCountCheckbox from "./TrafficCountCheckbox.vue";
import thousandsSeparator from "../../../../src/utils/thousandsSeparator.js";
import dayjs from "dayjs";
import advancedFormat from "dayjs/plugin/advancedFormat";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import DatePicker from "vue2-datepicker";
import "vue2-datepicker/index.css";
import {addMissingDataYear} from "../utils/addMissingData.js";
import {hasHolidayInWeek} from "../../../../src/utils/calendar.js";

dayjs.extend(advancedFormat);
dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

export default {
    name: "TrafficCountYear",
    components: {
        TrafficCountCompDiagram,
        TrafficCountCompTable,
        TrafficCountCheckbox,
        DatePicker
    },
    props: {
        api: {
            type: Object,
            required: true
        },
        thingId: {
            type: [Number, String],
            required: true
        },
        meansOfTransport: {
            type: String,
            required: true
        },
        reset: {
            type: Boolean,
            required: true
        },
        holidays: {
            type: Array,
            required: true
        },
        checkGurlittInsel: {
            type: Boolean,
            required: true
        }
    },
    data () {
        return {
            tab: "year",
            apiData: [],
            dates: [],

            // props for diagram
            setTooltipValue: (tooltipItem) => {
                // add 3 days to match thursdays
                const objMoment = dayjs(tooltipItem.datetime, "YYYY-MM-DD HH:mm:ss").add(3, "day");

                return this.$t("additional:modules.tools.gfi.themes.trafficCount.calendarweek") + " " + objMoment.format("WW") + " / " + objMoment.format("YYYY") + ": " + thousandsSeparator(tooltipItem.value);
            },
            yAxisTicks: 8,
            renderLabelXAxis: (datetime) => {
                // add 3 days to match thursdays
                const objMoment = dayjs(datetime, "YYYY-MM-DD HH:mm:ss").add(3, "day");

                return this.$t("additional:modules.tools.gfi.themes.trafficCount.calendarweek") + objMoment.format("WW");
            },
            renderLabelYAxis: (yValue) => {
                return thousandsSeparator(yValue);
            },
            descriptionYAxis: this.$t("additional:modules.tools.gfi.themes.trafficCount.yAxisTextYear"),
            renderLabelLegend: (datetime) => {
                return dayjs(datetime, "YYYY-MM-DD HH:mm:ss").add(4, "day").format("YYYY");
            },
            renderPointStyle: (datetime) => {
                const pointStyle = [],
                    format = "YYYY-MM-DD";

                for (let i = 0; i < datetime.length; i++) {
                    if (hasHolidayInWeek(datetime[i], this.holidays, format)) {
                        pointStyle.push("star");
                    }
                    else {
                        pointStyle.push("circle");
                    }
                }

                return pointStyle;
            },
            renderPointSize: (datetime) => {
                const pointSize = [],
                    format = "YYYY-MM-DD";

                for (let i = 0; i < datetime.length; i++) {
                    if (hasHolidayInWeek(datetime[i], this.holidays, format)) {
                        pointSize.push(6);
                    }
                    else {
                        pointSize.push(2);
                    }
                }

                return pointSize;
            },
            // props for table
            tableTitle: this.$t("additional:modules.tools.gfi.themes.trafficCount.tableTitleYear"),
            setColTitle: datetime => {
                return this.$t("additional:modules.tools.gfi.themes.trafficCount.calendarweek") + dayjs(datetime, "YYYY-MM-DD HH:mm:ss").format("WW");
            },
            setRowTitle: (meansOfTransports, datetime) => {
                // datetime is the monday of the week - so we have to add 3 days to get the thursday of the week
                const txt = dayjs(datetime, "YYYY-MM-DD HH:mm:ss").add(3, "day").format("YYYY");

                switch (meansOfTransports) {
                    // search for "trafficCountSVAktivierung" to find all lines of code to switch Kfz to Kfz + SV
                    // use this code to enable Kfz + SV
                    /*
                    case "Anzahl_Kfz":
                        return txt + " " + this.$t("additional:modules.tools.gfi.themes.trafficCount.carsHeaderSuffix");
                    case "Anzahl_SV":
                        return txt + " " + this.$t("additional:modules.tools.gfi.themes.trafficCount.trucksHeaderSuffix");
                    */
                    default:
                        return txt;
                }
            },
            setFieldValue: value => {
                return thousandsSeparator(value);
            },
            yearInterval: "1-Woche",
            diagramYear: "diagramYear",
            tableYear: "tableYear"
        };
    },
    watch: {
        reset () {
            this.initializeDates();
        },
        dates (value) {
            this.yearDatepickerValueChanged(value);
        }
    },
    mounted () {
        this.initializeDates();
    },
    methods: {
        /**
         * Initializes the calendar / resets the date.
         * @returns {void}
         */
        initializeDates () {
            this.dates = [this.checkGurlittInsel ? dayjs().subtract(1, "day").toDate() : dayjs().toDate()];
        },
        /**
         * Function is initially triggered and on update
         * @param   {Date} dates an unsorted array of first day date of selected year
         * @fires   Alerting#RadioTriggerAlertAlert
         * @returns {void}
         */
        yearDatepickerValueChanged: function (dates) {
            const api = this.api,
                thingId = this.thingId,
                meansOfTransport = this.meansOfTransport,
                timeSettings = [];

            if (!Array.isArray(dates) || dates.length === 0) {
                this.apiData = [];
            }
            else {
                [...dates].sort((earlyDate, lateDate) => {
                    // Showing earlier date first
                    return earlyDate - lateDate;
                }).forEach(date => {
                    timeSettings.push({
                        interval: this.yearInterval,
                        // subtract 3 days to savely include the first thursday of january into the interval, as the first calendar week always includes the first thursday of january
                        from: dayjs(date).startOf("year").subtract(3, "day").format("YYYY-MM-DD"),
                        // add 3 days to savely include the last thursday of december into the interval, as the last calendar week always includes the last thursday of december
                        until: dayjs(date).endOf("year").add(3, "day").format("YYYY-MM-DD"),
                        selectedYear: dayjs(date).format("YYYY")
                    });
                });

                api.updateDataset(thingId, meansOfTransport, timeSettings, datasets => {
                    if (Array.isArray(datasets)) {
                        datasets.forEach((transportData, idx) => {
                            const from = typeof timeSettings[idx] === "object" ? timeSettings[idx].selectedYear : "";

                            Object.keys(transportData).forEach(transportKey => {
                                datasets[idx][transportKey] = addMissingDataYear(from, datasets[idx][transportKey]);
                            });
                        });
                    }

                    this.apiData = datasets;
                }, errormsg => {
                    this.apiData = [];

                    console.warn("The data received from api are incomplete:", errormsg);
                    this.$store.dispatch("Alerting/addSingleAlert", {
                        content: this.$t("additional:modules.tools.gfi.themes.trafficCount.error.apiGeneral"),
                        category: "Info"
                    });
                });
            }
        },

        /**
         * Checks if the a date should be disabled.
         * @param {Date} date The date in question.
         * @param {Date[]} currentDates The list of selected dates.
         * @returns {Boolean} true if disabled, false if enabled.
         */
        isDateDisabled (date, currentDates) {
            if (!(date instanceof Date)) {
                return true;
            }
            let startMoment = dayjs().startOf("year").subtract(10, "year");

            const endDate = this.checkGurlittInsel ? dayjs().subtract(1, "day") : dayjs(),
                startYear = parseInt(startMoment.format("YYYY"), 10),
                question = dayjs(date);

            if (this.checkGurlittInsel) {
                if (startYear < 2014) {
                    startMoment = startMoment.add(2014 - startYear, "year");
                }
            }
            else if (startYear < 2020) {
                startMoment = startMoment.add(2020 - startYear, "year");
            }

            startMoment = startMoment.subtract(1, "year");

            if (Array.isArray(currentDates) && currentDates.length >= 5) {
                for (let i = 0; i < 5; i++) {
                    if (question.isSame(dayjs(currentDates[i]))) {
                        return false;
                    }
                }
                return true;
            }

            return question.isSameOrBefore(startMoment) || question.isSameOrAfter(endDate);
        }
    }
};
</script>

<template>
    <div>
        <div
            id="yearDateSelector"
            class="dateSelector"
        >
            <DatePicker
                v-model="dates"
                aria-label="Datum"
                placeholder="Datum"
                type="year"
                format="YYYY"
                :multiple="true"
                :disabled-date="isDateDisabled"
                title-format="YYYY"
                :lang="$t('common:libraries.vue2-datepicker.lang', {returnObjects: true})"
            />
        </div>
        <TrafficCountCheckbox
            :table-diagram-id="diagramYear"
        />
        <div id="diagramYear">
            <TrafficCountCompDiagram
                :api-data="apiData"
                :set-tooltip-value="setTooltipValue"
                :y-axis-ticks="yAxisTicks"
                :render-label-x-axis="renderLabelXAxis"
                :render-label-y-axis="renderLabelYAxis"
                :description-y-axis="descriptionYAxis"
                :render-label-legend="renderLabelLegend"
                :render-point-style="renderPointStyle"
                :render-point-size="renderPointSize"
            />
        </div>
        <TrafficCountCheckbox
            :table-diagram-id="tableYear"
        />
        <div id="tableYear">
            <TrafficCountCompTable
                :holidays="holidays"
                :current-tab-id="tab"
                :api-data="apiData"
                :table-title="tableTitle"
                :set-col-title="setColTitle"
                :set-row-title="setRowTitle"
                :set-field-value="setFieldValue"
            />
        </div>
    </div>
</template>

<style lang="scss">
#yearDateSelector {
    .mx-input {
        border-radius: 0px;
    }
}
</style>
