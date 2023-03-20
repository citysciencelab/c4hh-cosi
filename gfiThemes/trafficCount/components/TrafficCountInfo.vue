<script>
import dayjs from "dayjs";
import advancedFormat from "dayjs/plugin/advancedFormat";
import thousandsSeparator from "../../../../src/utils/thousandsSeparator";
import {mapGetters} from "vuex";

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
            workingDayAverageDesc: "",
            workingDayAverageValue: "",
            highestWorkloadDayDesc: "",
            highestWorkloadDayValue: "",
            highestWorkloadWeekDesc: "",
            highestWorkloadWeekValue: "",
            highestWorkloadMonthDesc: "",
            highestWorkloadMonthValue: ""
        };
    },
    computed: {
        ...mapGetters("Language", ["currentLocale"]),

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

        onThePreviousDay: function () {
            return this.$t("additional:modules.tools.gfi.themes.trafficCount.onThePreviousDay");
        },

        workingDayAverage: function () {
            return this.$t("additional:modules.tools.gfi.themes.trafficCount.workingDayAverage");
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
            immediate: true
        },

        meansOfTransport: {
            handler (newVal, oldVal) {
                if (oldVal) {
                    this.setupTabInfo(this.api, this.thingId, newVal);
                }
            },
            immediate: true
        }
    },
    mounted: function () {
        this.setupTabInfo(this.api, this.thingId, this.meansOfTransport);
    },
    methods: {
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
            }, errormsg => {
                this.setLastDayDesc(i18next.t("additional:modules.tools.gfi.themes.trafficCount.error.dataNotAvailableA"));
                this.setLastDayValue(i18next.t("additional:modules.tools.gfi.themes.trafficCount.error.dataNotAvailableB"));
                console.warn("The last update last day is incomplete:", errormsg);
                this.$store.dispatch("Alerting/addSingleAlert", i18next.t("additional:modules.tools.gfi.themes.trafficCount.error.apiFunction", {category: this.onThePreviousDay}));
            });

            api.updateWorkingDayAverage(thingId, meansOfTransport, this.rangeOfWorkingDayAverage, this.holidays, (date, value) => {
                this.setWorkingDayAverageDesc(typeof date === "string" ? dayjs(date, "YYYY-MM-DD").format("DD.MM.YYYY") : "");
                this.setWorkingDayAverageValue(thousandsSeparator(value));
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
        id="infos"
        class="infos"
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
                        <td class="bold">
                            {{ period }}
                        </td>
                        <td class="bold">
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
                        <td class="bold">
                            {{ onThePreviousDay }}
                        </td>
                        <td>
                            {{ lastDayDesc }}
                        </td>
                        <td>
                            {{ lastDayValue }}
                        </td>
                    </tr>
                    <tr colspan="3">
                        <td class="bold">
                            {{ workingDayAverage }}
                        </td>
                        <td>
                            {{ workingDayAverageDesc }}
                        </td>
                        <td>
                            {{ workingDayAverageValue }}
                        </td>
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
