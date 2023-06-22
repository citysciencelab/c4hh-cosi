<script>
import TrafficCountCompDiagram from "./TrafficCountCompDiagram.vue";
import TrafficCountCompTable from "./TrafficCountCompTable.vue";
import TrafficCountCheckbox from "./TrafficCountCheckbox.vue";
import thousandsSeparator from "../../../../../src_3_0_0/shared/js/utils/thousandsSeparator.js";
import dayjs from "dayjs";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import DatePicker from "vue-datepicker-next";
import "vue-datepicker-next/index.css";
import {addMissingDataDay} from "../utils/addMissingData.js";
import {getPublicHoliday} from "../../../../../src_3_0_0/shared/js/utils/calendar.js";
import {DauerzaehlstellenRadApi} from "../utils/dauerzaehlstellenRadApi";
import {mapGetters, mapMutations} from "vuex";

dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);

export default {
    name: "TrafficCountDay",
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
        },
        activeTab: {
            type: Boolean,
            required: true
        }
    },
    data () {
        return {
            tab: "day",
            apiData: [],
            dates: [],

            // props for diagram
            setTooltipValue: (tooltipItem) => {
                return dayjs(tooltipItem.datetime, "YYYY-MM-DD HH:mm:ss").format("DD.MM.YYYY, HH:mm") + " " + this.$t("additional:modules.tools.gfi.themes.trafficCount.clockLabel") + ": " + thousandsSeparator(tooltipItem.value);
            },
            xAxisTicks: 12,
            yAxisTicks: 8,
            renderLabelXAxis: (datetime) => {
                return dayjs(datetime, "YYYY-MM-DD HH:mm:ss").format("HH:mm") + " " + this.$t("additional:modules.tools.gfi.themes.trafficCount.clockLabel");
            },
            renderLabelYAxis: (yValue) => {
                return thousandsSeparator(yValue);
            },
            descriptionYAxis: this.$t("additional:modules.tools.gfi.themes.trafficCount.yAxisTextDay", {minutes: this.api instanceof DauerzaehlstellenRadApi ? 60 : 15}),
            renderLabelLegend: (datetime) => {
                return dayjs(datetime, "YYYY-MM-DD HH:mm:ss").format("DD.MM.YYYY");
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
            tableTitle: this.$t("additional:modules.tools.gfi.themes.trafficCount.tableTitleDay"),
            setColTitle: datetime => {
                return dayjs(datetime, "YYYY-MM-DD HH:mm:ss").format("HH:mm") + " " + this.$t("additional:modules.tools.gfi.themes.trafficCount.clockLabel");
            },
            setRowTitle: (meansOfTransports, datetime) => {
                const txt = dayjs(datetime, "YYYY-MM-DD HH:mm:ss").format("DD.MM.YYYY");

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
            dayInterval: "15-Min",
            diagramDay: "diagramDay",
            tableDay: "tableDay"
        };
    },
    computed: {
        ...mapGetters("Modules/TrafficCount", [
            "activeTabId"
        ])
    },
    watch: {
        reset () {
            this.initializeDates();
        },
        dates: {
            handler (value) {
                this.dayDatepickerValueChanged(value);
            },
            deep: true
        },
        activeTab () {
            if (this.activeTab && this.activeTabId !== "day") {
                this.setActiveTabId("day");
            }
        }
    },
    mounted () {
        this.initializeDates();
    },
    methods: {
        ...mapMutations("Modules/TrafficCount", [
            "setActiveTabId"
        ]),
        /**
         * Initializes the calendar / resets the date.
         * @returns {void}
         */
        initializeDates () {
            this.dates = [this.checkGurlittInsel ? dayjs().subtract(1, "day").toDate() : dayjs().toDate()];
        },
        /**
         * Function is initially triggered and on update
         * @param   {Date[]} dates an unsorted array of selected dates of weekday
         * @fires   Alerting#RadioTriggerAlertAlert
         * @returns {Void}  -
         */
        dayDatepickerValueChanged: function (dates) {
            const api = this.api,
                thingId = this.thingId,
                meansOfTransport = this.meansOfTransport,
                timeSettings = [],
                minutesForMissingData = api instanceof DauerzaehlstellenRadApi ? 60 : 15;

            if (!Array.isArray(dates) || dates.length === 0) {
                this.apiData = [];
            }
            else {
                [...dates].sort((earlyDate, lateDate) => {
                    // Showing earlier date first
                    return earlyDate - lateDate;
                }).forEach(date => {
                    const fromDate = dayjs(date).format("YYYY-MM-DD");

                    timeSettings.push({
                        interval: this.dayInterval,
                        from: fromDate,
                        until: fromDate
                    });
                });

                api.updateDataset(thingId, meansOfTransport, timeSettings, datasets => {
                    if (Array.isArray(datasets)) {
                        datasets.forEach((transportData, idx) => {
                            const from = typeof timeSettings[idx] === "object" ? timeSettings[idx].from + " 00:00:00" : "";

                            Object.keys(transportData).forEach(transportKey => {
                                datasets[idx][transportKey] = addMissingDataDay(from, datasets[idx][transportKey], minutesForMissingData);
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
            debugger;
            if (!(date instanceof Date)) {
                return true;
            }
            const endDate = this.checkGurlittInsel ? dayjs().subtract(1, "day") : dayjs(),
                startDate = dayjs().subtract(15, "day"),
                question = dayjs(date);

            if (Array.isArray(currentDates) && currentDates.length >= 5) {
                for (let i = 0; i < 5; i++) {
                    if (question.isSame(dayjs(currentDates[i]))) {
                        return false;
                    }
                }
                return true;
            }

            startDate.subtract(1, "day");

            return question.isSameOrBefore(startDate) || question.isSameOrAfter(endDate);
        }
    }
};
</script>

<template>
    <div v-if="activeTab">
        <div
            id="dayDateSelector"
            class="dateSelector"
        >
            <DatePicker
                v-model:value="dates"
                aria-label="Datum"
                placeholder="Datum"
                type="date"
                format="DD.MM.YYYY"
                :multiple="true"
                :show-week-number="true"
                title-format="DD.MM.YYYY"
                :lang="$t('common:libraries.vue2-datepicker.lang', {returnObjects: true})"
            />
        </div>
        <TrafficCountCheckbox
            :table-diagram-id="diagramDay"
        />
        <div id="diagramDay">
            <TrafficCountCompDiagram
                :api-data="apiData"
                :set-tooltip-value="setTooltipValue"
                :x-axis-ticks="xAxisTicks"
                :y-axis-ticks="yAxisTicks"
                :render-label-x-axis="renderLabelXAxis"
                :render-label-y-axis="renderLabelYAxis"
                :description-y-axis="descriptionYAxis"
                :render-label-legend="renderLabelLegend"
                :render-point-style="renderPointStyle"
                :render-point-size="renderPointSize"
                :active-tab="activeTab"
            />
        </div>
        <TrafficCountCheckbox
            :table-diagram-id="tableDay"
        />
        <div id="tableDay">
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
#dayDateSelector {
    .mx-input {
        border-radius: 0px;
    }
}
</style>
