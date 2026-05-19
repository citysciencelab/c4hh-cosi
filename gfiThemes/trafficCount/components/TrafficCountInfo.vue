<script>
import dayjs from "dayjs";
import advancedFormat from "dayjs/plugin/advancedFormat";
import thousandsSeparator from "../../../../src/shared/js/utils/thousandsSeparator.js";
import {mapGetters, mapMutations} from "vuex";

dayjs.extend(advancedFormat);

export default {
    name: "TrafficCountInfo",
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
        holidays: {
            type: Array,
            required: true
        },
        activeTab: {
            type: Boolean,
            required: true
        }
    },
    data () {
        return {
            rangeOfWorkingDayAverage: 365,
            totalDesc: "",
            totalValue: "",
            thisYearDesc: "",
            thisYearValue: "",
            lastYearDesc: "",
            lastYearValue: "",
            lastDayDesc: "",
            lastDayValue: "",
            lastDayValueSecond: undefined,
            workingDayAverageDesc: "",
            workingDayAverageValue: "",
            workingDayAverageDescSecond: undefined,
            workingDayAverageValueSecond: undefined,
            highestWorkloadDayDesc: "",
            highestWorkloadDayValue: "",
            highestWorkloadWeekDesc: "",
            highestWorkloadWeekValue: "",
            highestWorkloadMonthDesc: "",
            highestWorkloadMonthValue: "",
            isHeavyTrafficAvailable: false
        };
    },
    computed: {
        ...mapGetters("Language", ["currentLocale"]),
        ...mapGetters("Modules/TrafficCount", [
            "activeTabId"
        ]),

        period: function () {
            return this.$t("additional:modules.tools.gfi.themes.trafficCount.period");
        },

        number: function () {
            return this.$t("additional:modules.tools.gfi.themes.trafficCount.number");
        },

        totalSince: function () {
            return this.$t("additional:modules.tools.gfi.themes.trafficCount.totalSince");
        },

        sinceBeginningOfTheYear: function () {
            return this.$t("additional:modules.tools.gfi.themes.trafficCount.sinceBeginningOfTheYear");
        },

        overThePastYear: function () {
            return this.$t("additional:modules.tools.gfi.themes.trafficCount.overThePastYear");
        },

        /**
         * Returns the description of row onThePreviousDay.
         * @returns {String} the description.
         */
        onThePreviousDay: function () {
            let description = this.$t("additional:modules.tools.gfi.themes.trafficCount.onThePreviousDay");

            if (this.meansOfTransport === "Anzahl_Kfz" && typeof this.lastDayValueSecond !== "undefined") {
                description += "<br>" + this.$t("additional:modules.tools.gfi.themes.trafficCount.heavyTraffic");
            }
            else if (this.meansOfTransport === "Anzahl_Schwerverkehr" && typeof this.lastDayValueSecond !== "undefined") {
                description += "<br>" + this.$t("additional:modules.tools.gfi.themes.trafficCount.totalTraffic");
            }
            return description;
        },

        /**
         * Returns the value of row onThePreviousDay including comparison value.
         * @returns {String} the value.
         */
        lastDayValueDetailed: function () {
            if (typeof this.lastDayValueSecond !== "undefined") {
                return this.lastDayValue + "<br>(" + this.lastDayValueSecond + ")";
            }

            return this.lastDayValue;
        },

        /**
         * Returns the description of row workingDayAverage.
         * @returns {String} the description.
         */
        workingDayAverage: function () {
            let description = this.$t("additional:modules.tools.gfi.themes.trafficCount.workingDayAverage");

            if (this.meansOfTransport === "Anzahl_Kfz" && typeof this.workingDayAverageValueSecond !== "undefined") {
                description += "<br>" + this.$t("additional:modules.tools.gfi.themes.trafficCount.heavyTraffic");
            }
            else if (this.meansOfTransport === "Anzahl_Schwerverkehr" && typeof this.workingDayAverageValueSecond !== "undefined") {
                description += "<br>" + this.$t("additional:modules.tools.gfi.themes.trafficCount.totalTraffic");
            }
            return description;
        },

        /**
         * Returns the description of row workingDayAverage including comparison value.
         * @returns {String} the value.
         */
        workingDayAverageDescDetailed: function () {
            if (typeof this.workingDayAverageDescSecond !== "undefined" && this.workingDayAverageDesc !== "") {
                return this.workingDayAverageDesc + "<br>(" + this.workingDayAverageDescSecond + ")";
            }

            return this.workingDayAverageDesc;
        },

        /**
         * Returns the value of row workingDayAverage including comparison value.
         * @returns {String} the value.
         */
        workingDayAverageValueDetailed: function () {
            if (typeof this.workingDayAverageValueSecond !== "undefined" && this.workingDayAverageDesc !== "") {
                return this.workingDayAverageValue + "<br>(" + this.workingDayAverageValueSecond + ")";
            }

            return this.workingDayAverageValue;
        },

        highestDay: function () {
            return this.$t("additional:modules.tools.gfi.themes.trafficCount.highestDay");
        },

        highestWeek: function () {
            return this.$t("additional:modules.tools.gfi.themes.trafficCount.highestWeek");
        },

        highestMonth: function () {
            return this.$t("additional:modules.tools.gfi.themes.trafficCount.highestMonth");
        },

        calendarweek: function () {
            return this.$t("additional:modules.tools.gfi.themes.trafficCount.calendarweek");
        },

        /**
         * Returns the value of row isHeavyTrafficAvailableValue.
         * @returns {String} the value.
         */
        isHeavyTrafficAvailableValue: function () {
            if (this.meansOfTransport !== "Anzahl_Kfz") {
                return "";
            }
            return typeof this.lastDayValueSecond !== "undefined" ? this.$t("additional:modules.tools.gfi.themes.trafficCount.available") : this.$t("additional:modules.tools.gfi.themes.trafficCount.inavailable");
        },

        /**
         * Returns the description of row isHeavyTrafficAvailableValue.
         * @returns {String} the description.
         */
        isHeavyTrafficAvailableDesc: function () {
            return this.$t("additional:modules.tools.gfi.themes.trafficCount.isHeavyTrafficAvailableDesc");
        }
    },
    watch: {
        // When the gfi window switched with arrow, the new data will be fetched from api
        thingId: {
            handler (newVal, oldVal) {
                if (oldVal) {
                    this.setupTabInfo(this.api, newVal, this.meansOfTransport);
                }
            },
            immediate: true,
            deep: true
        },

        meansOfTransport: {
            handler (newVal, oldVal) {
                if (oldVal) {
                    this.setupTabInfo(this.api, this.thingId, newVal);
                }

                this.isHeavyTrafficAvailable = newVal === "Anzahl_Kfz";
            },
            immediate: true
        },
        activeTab () {
            if (this.activeTab && this.activeTabId !== "info") {
                this.setActiveTabId("info");
            }
        }
    },
    mounted: function () {
        this.setupTabInfo(this.api, this.thingId, this.meansOfTransport);
    },
    methods: {
        ...mapMutations("Modules/TrafficCount", [
            "setActiveTabId"
        ]),
        /**
         * setup of the info tab
         * @param {Object} api instance of TrafficCountApi
         * @param {String} thingId the thingId to be send to any api call
         * @param {String} meansOfTransport the meansOfTransport to be send with any api call
         * @fires   Alerting#RadioTriggerAlertAlert
         * @returns {void}
         */
        setupTabInfo: function (api, thingId, meansOfTransport) {
            api.updateTotal(thingId, meansOfTransport, (date, value) => {
                this.setTotalDesc(typeof date === "string" ? dayjs(date, "YYYY-MM-DD").format("DD.MM.YYYY") : "");
                this.setTotalValue(thousandsSeparator(value));
            }, errormsg => {
                this.setTotalDesc(i18next.t("additional:modules.tools.gfi.themes.trafficCount.error.dataNotAvailableA"));
                this.setTotalValue(i18next.t("additional:modules.tools.gfi.themes.trafficCount.error.dataNotAvailableB"));
                console.warn("The last update total is incomplete:", errormsg);
                this.$store.dispatch("Alerting/addSingleAlert", i18next.t("additional:modules.tools.gfi.themes.trafficCount.error.apiFunction", {category: this.totalSince}));
            });

            api.updateYear(thingId, meansOfTransport, dayjs().format("YYYY"), (year, value) => {
                this.setThisYearDesc(typeof year === "string" ? "01.01." + year : "");
                this.setThisYearValue(thousandsSeparator(value));
            }, errormsg => {
                this.setThisYearDesc(i18next.t("additional:modules.tools.gfi.themes.trafficCount.error.dataNotAvailableA"));
                this.setThisYearValue(i18next.t("additional:modules.tools.gfi.themes.trafficCount.error.dataNotAvailableB"));
                console.warn("The last update year is incomplete:", errormsg);
                this.$store.dispatch("Alerting/addSingleAlert", i18next.t("additional:modules.tools.gfi.themes.trafficCount.error.apiFunction", {category: this.sinceBeginningOfTheYear}));
            });

            api.updateYear(thingId, meansOfTransport, dayjs().subtract(1, "year").format("YYYY"), (year, value) => {
                this.setLastYearDesc(typeof year === "string" ? year : "");
                this.setLastYearValue(thousandsSeparator(value));
            }, errormsg => {
                this.setLastYearDesc(i18next.t("additional:modules.tools.gfi.themes.trafficCount.error.dataNotAvailableA"));
                this.setLastYearValue(i18next.t("additional:modules.tools.gfi.themes.trafficCount.error.dataNotAvailableB"));
                console.warn("The last update last year is incomplete:", errormsg);
                this.$store.dispatch("Alerting/addSingleAlert", i18next.t("additional:modules.tools.gfi.themes.trafficCount.error.apiFunction", {category: this.overThePastYear}));
            });

            api.updateDay(thingId, meansOfTransport, dayjs().subtract(1, "day").format("YYYY-MM-DD"), (date, value) => {
                this.setLastDayDesc(typeof date === "string" ? dayjs(date, "YYYY-MM-DD").format("DD.MM.YYYY") : "");
                this.setLastDayValue(thousandsSeparator(value));

                if (meansOfTransport === "Anzahl_Kfz" || meansOfTransport === "Anzahl_Schwerverkehr") {
                    const meansOfTransportSecond = meansOfTransport === "Anzahl_Kfz" ? "Anzahl_Schwerverkehr" : "Anzahl_Kfz";

                    api.updateDay(thingId, meansOfTransportSecond, dayjs().subtract(1, "day").format("YYYY-MM-DD"), (_, secondValue) => {
                        this.lastDayValueSecond = thousandsSeparator(secondValue);
                    }, errormsg => {
                        this.lastDayValueSecond = undefined;
                        console.warn("The last update last day of traffic is incomplete:", errormsg);
                    });
                }
            }, errormsg => {
                this.setLastDayDesc(i18next.t("additional:modules.tools.gfi.themes.trafficCount.error.dataNotAvailableA"));
                this.setLastDayValue(i18next.t("additional:modules.tools.gfi.themes.trafficCount.error.dataNotAvailableB"));
                console.warn("The last update last day is incomplete:", errormsg);
                this.$store.dispatch("Alerting/addSingleAlert", i18next.t("additional:modules.tools.gfi.themes.trafficCount.error.apiFunction", {category: this.onThePreviousDay}));
            });

            api.updateWorkingDayAverage(thingId, meansOfTransport, this.rangeOfWorkingDayAverage, this.holidays, (date, value) => {
                this.setWorkingDayAverageDesc(typeof date === "string" ? dayjs(date, "YYYY-MM-DD").format("DD.MM.YYYY") : "");
                this.setWorkingDayAverageValue(thousandsSeparator(value));

                if (meansOfTransport === "Anzahl_Kfz" || meansOfTransport === "Anzahl_Schwerverkehr") {
                    const meansOfTransportSecond = meansOfTransport === "Anzahl_Kfz" ? "Anzahl_Schwerverkehr" : "Anzahl_Kfz";

                    api.updateWorkingDayAverage(thingId, meansOfTransportSecond, this.rangeOfWorkingDayAverage, this.holidays, (secondDate, secondValue) => {
                        this.workingDayAverageDescSecond = typeof secondDate === "string" ? dayjs(secondDate, "YYYY-MM-DD").format("DD.MM.YYYY") : "";
                        this.workingDayAverageValueSecond = thousandsSeparator(secondValue);
                    }, errormsg => {
                        this.workingDayAverageDescSecond = undefined;
                        this.workingDayAverageValueSecond = undefined;
                        console.warn("The last update Working day average of second traffic is incomplete:", errormsg);
                    });
                }
            }, errormsg => {
                this.setWorkingDayAverageDesc(i18next.t("additional:modules.tools.gfi.themes.trafficCount.error.dataNotAvailableA"));
                this.setWorkingDayAverageValue(i18next.t("additional:modules.tools.gfi.themes.trafficCount.error.dataNotAvailableB"));
                console.warn("The last update Working day average is incomplete:", errormsg);
                this.$store.dispatch("Alerting/addSingleAlert", i18next.t("additional:modules.tools.gfi.themes.trafficCount.error.apiFunction", {category: this.workingDayAverage}));
            });

            api.updateHighestWorkloadDay(thingId, meansOfTransport, dayjs().format("YYYY"), (date, value) => {
                this.setHighestWorkloadDayDesc(typeof date === "string" ? dayjs(date, "YYYY-MM-DD").format("DD.MM.YYYY") : "");
                this.setHighestWorkloadDayValue(thousandsSeparator(value));
            }, errormsg => {
                this.setHighestWorkloadDayDesc(i18next.t("additional:modules.tools.gfi.themes.trafficCount.error.dataNotAvailableA"));
                this.setHighestWorkloadDayValue(i18next.t("additional:modules.tools.gfi.themes.trafficCount.error.dataNotAvailableB"));
                console.warn("The last update HighestWorkloadDay is incomplete:", errormsg);
                this.$store.dispatch("Alerting/addSingleAlert", i18next.t("additional:modules.tools.gfi.themes.trafficCount.error.apiFunction", {category: this.highestDay}));
            });

            api.updateHighestWorkloadWeek(thingId, meansOfTransport, dayjs().format("YYYY"), (calendarWeek, value) => {
                this.setHighestWorkloadWeekDesc(!isNaN(calendarWeek) || typeof calendarWeek === "string" ? this.calendarweek + " " + calendarWeek : "");
                this.setHighestWorkloadWeekValue(thousandsSeparator(value));
            }, errormsg => {
                this.setHighestWorkloadWeekDesc(i18next.t("additional:modules.tools.gfi.themes.trafficCount.error.dataNotAvailableA"));
                this.setHighestWorkloadWeekValue(i18next.t("additional:modules.tools.gfi.themes.trafficCount.error.dataNotAvailableB"));
                console.warn("The last update HighestWorkloadWeek is incomplete:", errormsg);
                this.$store.dispatch("Alerting/addSingleAlert", i18next.t("additional:modules.tools.gfi.themes.trafficCount.error.apiFunction", {category: this.highestWeek}));
            });

            api.updateHighestWorkloadMonth(thingId, meansOfTransport, dayjs().format("YYYY"), (month, value) => {
                this.setHighestWorkloadMonthDesc(typeof month === "string" ? dayjs(month, "MM").format("MMMM") : "");
                this.setHighestWorkloadMonthValue(thousandsSeparator(value));
            }, errormsg => {
                this.setHighestWorkloadMonthDesc(i18next.t("additional:modules.tools.gfi.themes.trafficCount.error.dataNotAvailableA"));
                this.setHighestWorkloadMonthValue(i18next.t("additional:modules.tools.gfi.themes.trafficCount.error.dataNotAvailableB"));
                console.warn("The last update HighestWorkloadMonth is incomplete:", errormsg);
                this.$store.dispatch("Alerting/addSingleAlert", i18next.t("additional:modules.tools.gfi.themes.trafficCount.error.apiFunction", {category: this.highestMonth}));
            });
        },

        /**
         * setter for the description of total
         * @param {String} value the description
         * @returns {void}
         */
        setTotalDesc: function (value) {
            this.totalDesc = value;
        },

        /**
         * setter for the value of total
         * @param {String} value the value
         * @returns {void}
         */
        setTotalValue: function (value) {
            this.totalValue = value;
        },

        /**
         * setter for the description of thisYearDesc
         * @param {String} value the description
         * @returns {void}
         */
        setThisYearDesc: function (value) {
            this.thisYearDesc = value;
        },

        /**
         * setter for the value of thisYearValue
         * @param {String} value the value
         * @returns {void}
         */
        setThisYearValue: function (value) {
            this.thisYearValue = value;
        },

        /**
         * setter for the description of lastYearDesc
         * @param {String} value the description
         * @returns {void}
         */
        setLastYearDesc: function (value) {
            this.lastYearDesc = value;
        },

        /**
         * setter for the value of lastYearValue
         * @param {String} value the value
         * @returns {void}
         */
        setLastYearValue: function (value) {
            this.lastYearValue = value;
        },

        /**
         * setter for the description of lastDayDesc
         * @param {String} value the description
         * @returns {void}
         */
        setLastDayDesc: function (value) {
            this.lastDayDesc = value;
        },

        /**
         * setter for the value of lastDayValue
         * @param {String} value the value
         * @returns {void}
         */
        setLastDayValue: function (value) {
            this.lastDayValue = value;
        },

        /**
         * setter for the description of WorkingDayAverageDesc
         * @param {String} value the description
         * @returns {void}
         */
        setWorkingDayAverageDesc: function (value) {
            this.workingDayAverageDesc = value;
        },

        /**
         * setter for the value of WorkingDayAverageValue
         * @param {String} value the value
         * @returns {void}
         */
        setWorkingDayAverageValue: function (value) {
            this.workingDayAverageValue = value;
        },

        /**
         * setter for the description of highestWorkloadDayDesc
         * @param {String} value the description
         * @returns {void}
         */
        setHighestWorkloadDayDesc: function (value) {
            this.highestWorkloadDayDesc = value;
        },

        /**
         * setter for the value of highestWorkloadDayValue
         * @param {String} value the value
         * @returns {void}
         */
        setHighestWorkloadDayValue: function (value) {
            this.highestWorkloadDayValue = value;
        },

        /**
         * setter for the description of highestWorkloadWeekDesc
         * @param {String} value the description
         * @returns {void}
         */
        setHighestWorkloadWeekDesc: function (value) {
            this.highestWorkloadWeekDesc = value;
        },

        /**
         * setter for the value of highestWorkloadWeekValue
         * @param {String} value the value
         * @returns {void}
         */
        setHighestWorkloadWeekValue: function (value) {
            this.highestWorkloadWeekValue = value;
        },

        /**
         * setter for the description of highestWorkloadMonthDesc
         * @param {String} value the description
         * @returns {void}
         */
        setHighestWorkloadMonthDesc: function (value) {
            this.highestWorkloadMonthDesc = value;
        },

        /**
         * setter for the value of highestWorkloadMonthValue
         * @param {String} value the value
         * @returns {void}
         */
        setHighestWorkloadMonthValue: function (value) {
            this.highestWorkloadMonthValue = value;
        }
    }
};
</script>

<template>
    <div
        v-if="activeTab"
        id="info"
        class="info"
    >
        <div
            id="trafficcount-info-table"
            class="padded"
        >
            <table class="table table-hover table-striped">
                <tbody>
                    <tr colspan="3">
                        <td class="bold">
                        &nbsp;
                        </td>
                        <td class="bold text-end">
                            {{ period }}
                        </td>
                        <td class="bold text-end">
                            {{ number }}
                        </td>
                    </tr>
                    <tr colspan="3">
                        <td class="bold">
                            {{ totalSince }}
                        </td>
                        <td>
                            {{ totalDesc }}
                        </td>
                        <td>
                            {{ totalValue }}
                        </td>
                    </tr>
                    <tr colspan="3">
                        <td class="bold">
                            {{ sinceBeginningOfTheYear }}
                        </td>
                        <td>
                            {{ thisYearDesc }}
                        </td>
                        <td>
                            {{ thisYearValue }}
                        </td>
                    </tr>
                    <tr colspan="3">
                        <td class="bold">
                            {{ overThePastYear }}
                        </td>
                        <td>
                            {{ lastYearDesc }}
                        </td>
                        <td>
                            {{ lastYearValue }}
                        </td>
                    </tr>
                    <tr colspan="3">
                        <td
                            class="bold"
                            v-html="onThePreviousDay"
                        />
                        <td
                            class="align-middle"
                        >
                            {{ lastDayDesc }}
                        </td>
                        <td v-html="lastDayValueDetailed" />
                    </tr>
                    <tr colspan="3">
                        <td
                            class="bold"
                            v-html="workingDayAverage"
                        />
                        <td v-html="workingDayAverageDescDetailed" />
                        <td v-html="workingDayAverageValueDetailed" />
                    </tr>
                    <tr colspan="3">
                        <td class="bold">
                            {{ highestDay }}
                        </td>
                        <td>
                            {{ highestWorkloadDayDesc }}
                        </td>
                        <td>
                            {{ highestWorkloadDayValue }}
                        </td>
                    </tr>
                    <tr colspan="3">
                        <td class="bold">
                            {{ highestWeek }}
                        </td>
                        <td>
                            {{ highestWorkloadWeekDesc }}
                        </td>
                        <td>
                            {{ highestWorkloadWeekValue }}
                        </td>
                    </tr>
                    <tr colspan="3">
                        <td class="bold">
                            {{ highestMonth }}
                        </td>
                        <td>
                            {{ highestWorkloadMonthDesc }}
                        </td>
                        <td>
                            {{ highestWorkloadMonthValue }}
                        </td>
                    </tr>
                    <tr
                        v-if="isHeavyTrafficAvailable"
                        colspan="3"
                    >
                        <td class="bold">
                            {{ isHeavyTrafficAvailableDesc }}
                        </td>
                        <td />
                        <td>
                            {{ isHeavyTrafficAvailableValue }}
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
</template>

<style lang="scss" scoped>
    #trafficcount-info-table {
        margin: 6px 0 0 0;
        table {
            margin: 0;
            tbody {
                tr:first-child {
                    td {
                        text-align: left;
                    }
                }
            }
            td,
            th {
                text-align: right;
            }
             td:first-child{
                 text-align: left;
             }
        }
    }
</style>
