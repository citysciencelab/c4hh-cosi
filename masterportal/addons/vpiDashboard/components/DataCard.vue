<script>
import {mapActions, mapGetters, mapState} from "vuex";
import getters from "../store/gettersVpiDashboard.js";
import actions from "../store/actionsVpiDashboard.js";
import DataCardPaginator from "./DataCardPaginator.vue";

export default {
    name: "DataCard",
    components: {DataCardPaginator},
    props: {
        title: {
            type: String,
            required: true
        },
        detail: {
            type: String,
            required: false,
            default: ""
        },
        navigation: {
            type: Boolean,
            required: false,
            default: false
        },
        subtitle: {
            type: String,
            required: false,
            default: ""
        },
        showDetailsButton: {
            type: Boolean,
            required: false,
            default: false
        },
        subsetYear: {
            type: Number,
            required: false,
            default: 0
        },
        subsetMonth: {
            type: Number,
            required: false,
            default: 0
        },
        updateIndex: {
            type: Number,
            required: false,
            default: 0
        },
        startValueIndex: {
            type: Number,
            required: false,
            default: 0
        }
    },
    computed: {
        ...mapGetters("Modules/VpiDashboard", Object.keys(getters)),
        ...mapState(
            "Modules/VpiDashboard",
            [
                "sumVisitorsPerMonth",
                "averageVisitorsPerDay",
                "visitorsPerYear",
                "averageVisitorsPerWeek"
            ]),
        /**
         * returns the data for the selected card at the current page
         * @returns {String} the average or yearly number of visitors for the current parameters
         */
        statisticSet () {
            if (this.detail === "monthly") {
                if (Object.keys(this.sumVisitorsPerMonth).length > 0 && Object.keys(this.sumVisitorsPerMonth[this.subsetYear] || {}).length > 0) {
                    return this.getStatisticValue(this.sumVisitorsPerMonth, this.subsetYear, this.currentMonthIndex, "sum");
                }
                return "n/a";
            }
            if (this.detail === "daily") {
                if (Object.keys(this.averageVisitorsPerDay).length > 0 && Object.keys(this.averageVisitorsPerDay[this.subsetYear] || {}).length > 0 && Object.keys(this.averageVisitorsPerDay[this.subsetYear][this.subsetMonth]).length > 0) {
                    return this.getStatisticValue(this.averageVisitorsPerDay, this.subsetYear, this.subsetMonth, "avg", this.currentDayIndex);
                }
                return "n/a";
            }
            if (this.detail === "visitors" && this.visitorsPerYear !== "") {
                const selectedYearData = this.visitorsPerYear.filter((element) => {
                    return Number(element.date__year) === this.currentIndex + 2024;
                });

                if (selectedYearData.length) {
                    return selectedYearData.length > 0 && selectedYearData[0].avg
                        ? selectedYearData[0].avg.toLocaleString(this.currentLocale)
                        : "n/a";
                }
                return "n/a";
            }

            // Cards for Tab Herkunft
            if (this.detail === "visitorTypeResidentsPerWeek" && this.averageVisitorsPerWeek?.Hamburger) {
                return this.getWeeklyStatisticValue(this.averageVisitorsPerWeek.Hamburger);
            }
            if (this.detail === "visitorTypeCommutersPerWeek" && this.averageVisitorsPerWeek?.Pendler) {
                return this.getWeeklyStatisticValue(this.averageVisitorsPerWeek.Pendler);
            }
            if (this.detail === "visitorTypeTouristsPerWeek" && this.averageVisitorsPerWeek?.Touristen) {
                return this.getWeeklyStatisticValue(this.averageVisitorsPerWeek.Touristen);
            }

            return null;
        },
        /**
         * returns a list of month names or day names with can be used together with the paginator to walk through the data
         * @returns {Array} an array of months or days
         */
        paginatorData () {
            if (this.detail === "monthly") {
                return this.translate("additional:modules.tools.vpidashboard.time.months", {returnObjects: true});
            }
            if (this.detail === "daily") {
                return this.translate("additional:modules.tools.vpidashboard.time.days", {returnObjects: true});
            }
            if (this.detail === "visitors") {
                return this.yearList;
            }
            return null;
        },
        /**
         * gets the currently selected year
         * @returns {Integer} the currently selected year
         */
        currentlySelectedYear () {
            return this.yearList[this.currentIndex];
        }
    },
    methods: {
        ...mapActions("Modules/VpiDashboard", Object.keys(actions)),
        /**
         * reacts on the change of the paginator in monthly or daily data card
         * @param {String} index selected page to be shown
         * @returns {void}
         */
        changeIndex (index) {
            if (this.detail === "monthly") {
                this.$store.commit("Modules/VpiDashboard/setCurrentMonthIndex", index);
            }
            else if (this.detail === "daily") {
                this.$store.commit("Modules/VpiDashboard/setCurrentDayIndex", index);
            }
            else if (this.detail === "visitors") {
                this.$store.commit("Modules/VpiDashboard/setCurrentIndex", index);
            }

            this.$emit("indexChanged", index);
        },
        /**
         * calls a store function to change the used chart data based and initiates change in chart and button style
         * @param {String} chartOverview selected chart to be shown
         * @returns {void}
         */
        showChart (chartOverview) {
            this.changeChart(chartOverview);
        },
        /**
         * translates the given key, checks if the key exists and throws a console warning if not
         * @param {String} key the key to translate
         * @param {Object} [options=null] for interpolation, formating and plurals
         * @returns {String} the translation or the key itself on error
         */
        translate (key, options = null) {
            if (key === "additional:" + this.$t(key)) {
                console.warn("the key " + JSON.stringify(key) + " is unknown to the additional translation");
            }

            return this.$t(key, options);
        },
        /**
         * returns the statistic value for the given year, month and day
         * @returns {string} the current index
         */
        getStatisticValue (data, year, month, property, day = null) {
            if (data?.[year]?.[month]) {
                const value = day !== null ? data[year][month][day]?.[property] : data[year][month]?.[property];

                return value ? value.toLocaleString(this.currentLocale) : "n/a";
            }

            return "n/a";
        },
        /**
         * returns the statistic value for current selected year
         * @returns {string} the current index
         */
        getWeeklyStatisticValue (data) {
            if (data && typeof data === "object") {
                const value = data[this.currentlySelectedYear];

                return value ? value.toLocaleString(this.currentLocale) : "n/a";
            }
            return "n/a";
        }
    }
};
</script>

<template>
    <div
        :id="`card` + title"
        class="vpicard statistic-card"
    >
        <h4>{{ title }}</h4>
        <div v-if="navigation">
            <DataCardPaginator
                :paginator-data="paginatorData"
                :start-index="detail === 'monthly' ? currentMonthIndex : detail === 'daily' ? currentDayIndex : currentIndex"
                @pager="changeIndex"
            />
        </div>
        <div>
            <span class="card-text">
                {{ statisticSet }}
            </span>
        </div>
        <div class="card-buttons">
            <button
                v-if="showDetailsButton"
                :id="`button` + title"
                class="btn-secondary detailButton"
                @click="showChart(`${detail}overview`)"
            >
                {{ translate("additional:modules.tools.vpidashboard.details") }}
            </button>
        </div>
        <div v-if="!navigation">
            <h4>
                {{ subtitle }}
            </h4>
        </div>
    </div>
</template>

<style lang="scss">
.vpicard {
    display: flex;
    flex-direction: column;
    justify-content: space-around;
    align-items: center;
    width: 12rem;
    max-width: 12rem;
    height: 12rem;
    padding: 1rem;
    background: #f6f7f8;
    border: none;
}

.vpicard h4 {
    font-size: 0.7rem;
    text-align: center;
    margin-bottom: 0;

}

.vpicard h5 {
    font-size: 0.6rem;
    text-align: center;
    margin-bottom: 0;

}

.vpicard .card-buttons {
    width: 100%;
    display: flex;
    justify-content: center;
    gap: 1rem;
}

.card-text {
    font-family: "HamburgSans-Regular", sans-serif;
    font-style: normal;
    font-weight: 900;
    font-size: 16pt;
    text-align: center;
    letter-spacing: .2px;
    color: #000;
    display: block;
}
</style>
