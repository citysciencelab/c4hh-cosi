<script>
import TrafficCountCompDiagram from "./TrafficCountCompDiagram.vue";
import TrafficCountCompTable from "./TrafficCountCompTable.vue";
import TrafficCountCheckbox from "./TrafficCountCheckbox.vue";
import thousandsSeparator from "../../../../src/shared/js/utils/thousandsSeparator.js";
import dayjs from "dayjs";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import DatePicker from "vue-datepicker-next";
import "vue-datepicker-next/index.css";
import {addMissingDataDay} from "../utils/addMissingData.js";
import {getPublicHoliday} from "../../../../src/shared/js/utils/calendar.js";
import {DauerzaehlstellenRadApi} from "../utils/dauerzaehlstellenRadApi.js";
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
                let postfix = "";

                if (tooltipItem?.dataset?.isSVAvailable) {
                    postfix = " " + this.$t("additional:modules.tools.gfi.themes.trafficCount.heavyTraffic");
                }
                else if (tooltipItem?.dataset?.isKFZAvailable) {
                    postfix = " " + this.$t("additional:modules.tools.gfi.themes.trafficCount.totalTraffic");
                }

                return dayjs(tooltipItem.datetime, "YYYY-MM-DD HH:mm:ss").format("DD.MM.YYYY, HH:mm") + " " + this.$t("additional:modules.tools.gfi.themes.trafficCount.clockLabel") + ": " + thousandsSeparator(tooltipItem.raw) + postfix;
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
            renderPointStyle: (meansOfTransports, datetime, forLegend = false) => {
                if (forLegend) {
                    return meansOfTransports === "Anzahl_Schwerverkehr" ? "triangle" : "circle";
                }
                const pointStyle = [],
                    format = "YYYY-MM-DD";

                for (let i = 0; i < datetime.length; i++) {
                    if (getPublicHoliday(datetime[i], this.holidays, format)) {
                        pointStyle.push("star");
                    }
                    else if (meansOfTransports === "Anzahl_Schwerverkehr") {
                        pointStyle.push("triangle");
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

                if (meansOfTransports === "Anzahl_Schwerverkehr" && this.meansOfTransport === "Anzahl_Kfz") {
                    return txt + " " + this.$t("additional:modules.tools.gfi.themes.trafficCount.heavyTraffic");
                }
                else if (meansOfTransports === "Anzahl_Kfz" && this.meansOfTransport === "Anzahl_Schwerverkehr") {
                    return txt + " " + this.$t("additional:modules.tools.gfi.themes.trafficCount.totalTraffic");
                }

                return txt;
            },
            setFieldValue: value => {
                return thousandsSeparator(value);
            },
            dayInterval: "15-Min",
            diagramDay: "diagramDay",
            tableDay: "tableDay",
            meansOfTransportKey: [this.meansOfTransport]
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
                    if (meansOfTransport === "Anzahl_Schwerverkehr" || meansOfTransport === "Anzahl_Kfz") {
                        const otherTransport = meansOfTransport === "Anzahl_Kfz" ? "Anzahl_Schwerverkehr" : "Anzahl_Kfz";

                        api.updateDataset(thingId, otherTransport, timeSettings, otherDatasets => {
                            if (Array.isArray(otherDatasets)) {
                                otherDatasets.forEach((transportData, idx) => {
                                    const from = typeof timeSettings[idx] === "object" ? timeSettings[idx].from + " 00:00:00" : "";

                                    Object.keys(transportData).forEach(transportKey => {
                                        datasets[idx][transportKey] = addMissingDataDay(from, otherDatasets[idx][transportKey], minutesForMissingData);
                                    });
                                });
                            }
                        }, errormsg => {
                            console.warn("The data received from api are incomplete:", errormsg);
                        });
                    }

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
        },

        /**
         * Set the means of transport key for diagram and table
         * @param {String[]} keys means of transport key.
         * @returns {void}
         */
        setMeansOfTransportKey (keys) {
            this.meansOfTransportKey = keys;
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
                :disabled-date="isDateDisabled"
                title-format="DD.MM.YYYY"
                :lang="$t('common:libraries.vue-datepicker-next.lang', {returnObjects: true})"
            />
        </div>
        <TrafficCountCheckbox
            :current-means-of-transport="meansOfTransport"
            :last-means-of-transport-key="meansOfTransportKey"
            :table-diagram-id="diagramDay"
            @set-means-of-transport-key="setMeansOfTransportKey"
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
                :current-means-of-transport="meansOfTransport"
                :means-of-transport-key="meansOfTransportKey"
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
                :means-of-transport-key="meansOfTransportKey"
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
