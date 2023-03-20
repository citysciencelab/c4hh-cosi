<script>
import TrafficCountCompDiagram from "./TrafficCountCompDiagram.vue";
import TrafficCountCompTable from "./TrafficCountCompTable.vue";
import TrafficCountCheckbox from "./TrafficCountCheckbox.vue";
import thousandsSeparator from "../../../../src/utils/thousandsSeparator.js";
import dayjs from "dayjs";
import weekOfYear from "dayjs/plugin/weekOfYear";
import isoWeek from "dayjs/plugin/isoWeek";
import advancedFormat from "dayjs/plugin/advancedFormat";
import {addMissingDataWeek} from "../utils/addMissingData.js";
import {getPublicHoliday} from "../../../../src/utils/calendar.js";
import TrafficCountDatePicker from "./TrafficCountDatePicker.vue";
import isObject from "../../../../src/utils/isObject";

dayjs.extend(weekOfYear);
dayjs.extend(advancedFormat);
dayjs.extend(isoWeek);

export default {
    name: "TrafficCountWeek",
    components: {
        TrafficCountCompDiagram,
        TrafficCountCompTable,
        TrafficCountCheckbox,
        TrafficCountDatePicker
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
        }
    },
    data () {
        return {
            tab: "week",
            apiData: [],
            dates: null,
            showPreviousWeekUntilThisWeekday: 1,

            // props for diagram
            setTooltipValue: (tooltipItem) => {
                return dayjs(tooltipItem.datetime, "YYYY-MM-DD HH:mm:ss").format("DD.MM.YYYY") + ": " + thousandsSeparator(tooltipItem.value);
            },
            yAxisTicks: 8,
            renderLabelXAxis: (datetime) => {
                return dayjs(datetime, "YYYY-MM-DD HH:mm:ss").format("dd");
            },
            renderLabelYAxis: (yValue) => {
                return thousandsSeparator(yValue);
            },
            descriptionYAxis: i18next.t("additional:modules.tools.gfi.themes.trafficCount.yAxisTextWeek"),
            renderLabelLegend: (datetime) => {
                const weeknumber = dayjs(datetime, "YYYY-MM-DD HH:mm:ss").week(),
                    year = dayjs(datetime, "YYYY-MM-DD HH:mm:ss").format("YYYY");

                return this.calendarweek + " " + weeknumber + " / " + year;
            },
            renderPointStyle: (datetime) => {
                const pointStyle = [],
                    format = "YYYY-MM-DD";

                for (let i = 0; i < datetime.length; i++) {
                    if (getPublicHoliday(datetime[i], this.holidays, format)) {
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
                    if (getPublicHoliday(datetime[i], this.holidays, format)) {
                        pointSize.push(6);
                    }
                    else {
                        pointSize.push(2);
                    }
                }

                return pointSize;
            },
            // props for table
            tableTitle: i18next.t("additional:modules.tools.gfi.themes.trafficCount.tableTitleWeek") ? i18next.t("additional:modules.tools.gfi.themes.trafficCount.tableTitleWeek") : "",
            setColTitle: datetime => {
                return dayjs(datetime, "YYYY-MM-DD HH:mm:ss").format("dd");
            },
            setRowTitle: (meansOfTransports, datetime) => {
                let txt = "";

                txt += this.calendarweek + dayjs(datetime, "YYYY-MM-DD HH:mm:ss").format("WW");
                // for the year (YYYY) we have to add 3 days to get the thursday of the week
                txt += "/" + dayjs(datetime, "YYYY-MM-DD HH:mm:ss").add(3, "day").format("YYYY");
                txt += " (" + dayjs(datetime, "YYYY-MM-DD HH:mm:ss").format("dd, DD.MM.YYYY") + ")";

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
            weekInterval: "1-Tag",
            diagramWeek: "diagramWeek",
            tableWeek: "tableWeek"
        };
    },
    computed: {
        calendarweek: function () {
            return this.$t("additional:modules.tools.gfi.themes.trafficCount.calendarweek");
        }
    },
    watch: {
        reset () {
            this.initializeDates();
        },
        dates (value) {
            if (Array.isArray(value)) {
                this.weekDatepickerValueChanged(value);
            }
        }
    },
    created () {
        this.weekFormat = "YYYY [KW] WW";
        this.initializeDates();
        this.maxDate = this.checkGurlittInsel ? dayjs().subtract(1, "day").format("YYYY-MM-DD") : dayjs().format("YYYY-MM-DD");
        this.minDate = dayjs().subtract(1, "year").startOf("year").format("YYYY-MM-DD");
    },
    methods: {
        /**
         * Initializes the calendar / resets the date.
         * @returns {void}
         */
        initializeDates () {
            if (dayjs().isoWeekday() <= this.showPreviousWeekUntilThisWeekday) {
                this.dates = [dayjs().subtract(7, "day").format(this.weekFormat)];
            }
            else {
                this.dates = [dayjs().format(this.weekFormat)];
            }
        },
        /**
         * Function is initially triggered and on update
         * @param   {Date[]} dates an unsorted array of selected dates of weekday
         * @fires   Alerting#RadioTriggerAlertAlert
         * @returns {Void}  -
         */
        weekDatepickerValueChanged: function (dates) {
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

                    const weekFromDate = dayjs().year(Number(date.toString().slice(0, 4))).isoWeek(Number(date.slice(date.length - 2, date.length)));

                    timeSettings.push({
                        interval: this.weekInterval,
                        from: weekFromDate.isoWeekday(1).format("YYYY-MM-DD"),
                        until: weekFromDate.isoWeekday(7).format("YYYY-MM-DD")
                    });

                });

                api.updateDataset(thingId, meansOfTransport, timeSettings, datasets => {
                    if (Array.isArray(datasets)) {
                        datasets.forEach((transportData, idx) => {
                            const from = typeof timeSettings[idx] === "object" && dayjs(timeSettings[idx].from).isValid() ? timeSettings[idx].from + " 00:00:00" : "";

                            Object.keys(transportData).forEach(transportKey => {
                                datasets[idx][transportKey] = addMissingDataWeek(from, datasets[idx][transportKey]);
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
         * Changes the dates array with given dates.
         * @param {String[]} dates The dates.
         * @returns {void}
         */
        change (dates) {
            if (!Array.isArray(dates)) {
                return;
            }
            this.dates = dates;
        },
        /**
         * Gets the date field title based on given dayjs date.
         * @param {Object} momentDate The dayjs date.
         * @returns {String} The date field title.
         */
        getDateFieldTitle (momentDate) {
            if (typeof momentDate?.format !== "function") {
                return "";
            }
            const holidayName = getPublicHoliday(momentDate.toDate(), this.holidays);

            if (isObject(holidayName)) {
                return `${this.$t(holidayName.translationKey)}, ${momentDate.format("DD.MM.YYYY")}`;
            }
            return momentDate.format("DD.MM.YYYY");
        },
        /**
         * Returns if the given dayjs date is a holiday.
         * @param {Object} momentDate The dayjs date.
         * @returns {Boolean} True if it is a holiday.
         */
        isPublicHoliday (momentDate) {
            return Boolean(getPublicHoliday(momentDate.toDate(), this.holidays));
        },
        /**
         * Gets the current switch as formatted string.
         * @param {Object} momentDate A dayjs date.
         * @returns {String} The formatted string.
         */
        getCurrentSwitchFormatted (momentDate) {
            const months = this.$t("additional:modules.tools.gfi.themes.trafficCount.datepicker.monthsShort", {returnObjects: true});

            return `${months[momentDate.get("month")]} ${momentDate.format("YYYY")}`;
        }
    }
};
</script>

<template>
    <div>
        <div
            id="weekDateSelector"
            class="dateSelector"
        >
            <TrafficCountDatePicker
                type="week"
                input-delimiter=", "
                :format="weekFormat"
                :initial-dates="dates"
                :show-week-number="true"
                :max-selection="5"
                :min-date="minDate"
                :max-date="maxDate"
                @change="change"
            >
                <template #currentSwitch="{momentDate}">
                    {{ getCurrentSwitchFormatted(momentDate) }}
                </template>
                <template #dateField="{day, momentDate}">
                    <span
                        v-if="isPublicHoliday(momentDate)"
                        :title="getDateFieldTitle(momentDate)"
                    ><strong>{{ day }}</strong></span>
                    <span
                        v-else
                        :title="getDateFieldTitle(momentDate)"
                    >{{ day }}</span>
                </template>
            </TrafficCountDatePicker>
        </div>
        <TrafficCountCheckbox
            :table-diagram-id="diagramWeek"
        />
        <div id="diagramWeek">
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
            :table-diagram-id="tableWeek"
        />
        <div id="tableWeek">
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
#weekDateSelector {
    .mx-input {
        border-radius: 0px;
    }
}
</style>
