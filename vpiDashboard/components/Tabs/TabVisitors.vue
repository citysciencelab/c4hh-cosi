<script>
import {mapGetters, mapActions, mapMutations} from "vuex";
import getters from "../../store/gettersVpiDashboard.js";
import actions from "../../store/actionsVpiDashboard.js";
import {disabledDates} from "../../utils/dateHelpers.js";
import dayjs from "dayjs";
import "dayjs/locale/de";
import apiEndpointService from "../../store/apiEndpointService.js";

// Components Import
import LinechartItem from "../../../../src/shared/modules/charts/components/LinechartItem.vue";
import DataCard from "../DataCard.vue";
import BarchartItem from "../../../../src/shared/modules/charts/components/BarchartItem.vue";
import DatePicker from "vue-datepicker-next";
import "vue-datepicker-next/index.css";
import "vue-datepicker-next/locale/de.js";
import ChangeChartTypeButtons from "../ChangeChartTypeButtons.vue";
import RangeSlider from "../RangeSlider.vue";

export default {
    name: "TabVisitors",
    components: {
        DataCard,
        LinechartItem,
        BarchartItem,
        DatePicker,
        ChangeChartTypeButtons,
        RangeSlider
    },
    data () {
        return {
            chartType: "bar",
            chartdata: {
                bar: {
                    datasets: [
                        {
                            backgroundColor: "#002680",
                            data: [1, 2, 3],
                            hoverOffset: 4,
                            label: "Label"
                        }
                    ]
                },
                line: {
                    datasets: [
                        {
                            backgroundColor: "#002680",
                            data: [1, 2, 3],
                            hoverOffset: 4,
                            label: "Label"
                        }
                    ]
                }
            },
            possibleChartDatasets: [
                {
                    name: "additional:modules.tools.vpidashboard.unique.monthlyOverview",
                    id: "monthlyoverview"
                },
                {
                    name: "additional:modules.tools.vpidashboard.unique.dailyOverview",
                    id: "dailyoverview"
                },
                {
                    name: "additional:modules.tools.vpidashboard.unique.hourly",
                    id: "hourly"
                },
                {
                    name: "additional:modules.tools.vpidashboard.unique.daily",
                    id: "daily"
                }
            ],
            selectedChartData: "monthlyoverview",
            currentlySelectedMonth: 0,
            reloadChart: 1,
            dates: [],
            hourlyXLabels: [],
            dailyXLabels: [],
            showDatepicker: false,
            showChart: false
        };
    },
    computed: {
        ...mapGetters("Modules/VpiDashboard", Object.keys(getters)),
        selectedChartDataComputed: {
            /**
             * define, which data shall be the base of the chart
             * will initiate the change of chart when a value is set
             * @returns {String} selectedChartData
             */
            get () {
                return this.selectedChartData;
            },
            /**
             * define, which data shall be the base of the chart
             * will initiate the change of chart when a value is set
             * @param {String} value selected value from dropdown, can be one of possibleChartDatasets.chart
             * @returns {void}
             */
            set (value) {
                this.selectedChartData = value;
                this.switchChart();
            }
        },
        sliderSelectedValuesModel: {
            /**
             * gets the selected values of the slider
             * @returns {Array} the selected values
            */
            get () {
                return this.sliderSelectedValues;
            },
            /**
             * sets the selected values of the slider
             * @param {Array} value the selected values
             * @returns {void}
            */
            set (value) {
                this.setSliderSelectedValues(value);
            }
        },
        /**
         * will check if a user interaction is neccessary for this chart type (request of date value will be initiated based on this value)
         * @returns {Boolean} is visitors chart type
        */
        isVisitorsChartType () {
            return ["hourly", "daily"].includes(this.selectedChartData);
        },
        /**
         * gets the currently selected year
         * @returns {Integer} the currently selected year
         */
        currentlySelectedYear () {
            return this.yearList[this.currentIndex];
        }
    },
    watch: {
        dates (value) {
            this.dayDatepickerValueChanged(value);
        },
        async selectedLocationId () {
            await this.getVisitors();
            this.fillInitialChartData();
        }
    },
    async created () {
        await this.getVisitors();
        this.fillInitialChartData();
    },
    methods: {
        disabledDates,
        ...mapActions("Modules/VpiDashboard", Object.keys(actions)),
        ...mapMutations("Modules/VpiDashboard", ["setSliderSelectedValues", "setSliderData", "setLoader"]),
        /**
         * Create the chart data for first overview
         * @returns {void}
        */
        async fillInitialChartData () {
            this.dayDatepickerValueChanged(this.dates);
            this.$store.commit("Modules/VpiDashboard/setBarChartMonthlyData", this.currentlySelectedYear);
            this.$store.commit("Modules/VpiDashboard/setLineChartMonthlyData", this.currentlySelectedYear);
            this.$store.commit("Modules/VpiDashboard/setBarChartDailyData", {year: this.currentlySelectedYear, month: this.currentlySelectedMonth});
            this.$store.commit("Modules/VpiDashboard/setLineChartDailyData", {year: this.currentlySelectedYear, month: this.currentlySelectedMonth});
            this.getCurrentChartsData();
        },
        /**
         * define, which chart type shall be displayed
         * @param {String} chartType an be one of "bar" or "line"
         * @returns {void}
        */
        setChartType (chartType) {
            this.chartType = chartType;
        },
        /**
         * prepares the change of the data based of the shown chart
         * if a visitors chart type (urges the user to pick a date / date range before) is selected, the date picker is prepared
         * otherwise the data are selected and the chart change is started
         * @returns {void}
        */
        switchChart () {
            this.showDatepicker = false;
            if (this.isVisitorsChartType) {
                this.dayDatepickerValueChanged(this.dates);
                this.showDatepicker = true;
            }
            else {
                this.getCurrentChartsData();
            }
        },
        /**
         * requests the data from the store for those chart data that are static
         * @returns {void}
        */
        getCurrentChartsData () {
            switch (this.selectedChartData) {
                case "dailyoverview":
                    this.updateChartValues(this.barChartDailyData, this.lineChartDailyData, this.dailyOverviewXLabels);
                    break;
                case "monthlyoverview":
                    this.updateChartValues(this.barChartMonthlyData, this.lineChartMonthlyData, this.monthlyXLabels);
                    break;
                default:
                    this.updateChartValues();
                    break;
            }
        },
        /**
         * updates the chart values for both, bar and line chart and the labels
         * @param {Array} barChartDatasets array of values, used to build the bar chart
         * @param {Array} lineChartDatasets array of values, used to build the line chart
         * @param {Array} labels array of labels, used to build the charts
         * @returns {void}
         */
        updateChartValues (barChartDatasets = [], lineChartDatasets = [], labels = []) {
            this.chartdata.bar.datasets = barChartDatasets;
            this.chartdata.line.datasets = lineChartDatasets;
            this.chartdata.line.labels = this.chartdata.bar.labels = labels;
            this.reloadChart++;
            this.showChart = true;
            this.setSliderSelectedValues([]);
            this.updateSliderData();
        },
        /**
         * when the user selected a date, the data need to be requested from OGC-API and the chart data need to be created
         * @param {String | Array} values can hold a single day or a date range, depending on the selected chart type
         * @returns {void}
        */
        async dayDatepickerValueChanged (values) {
            let responses = [];

            if (values[0] && values[1]) {
                this.setLoader(true);
                if (this.selectedChartData === "hourly") {
                    responses = await apiEndpointService.receiveVisitorsHourly(
                        [this.selectedLocationId],
                        dayjs(values[0]).format("YYYY-MM-DD"),
                        dayjs(values[1]).format("YYYY-MM-DD")
                    );
                    this.setChartData(responses[0].features);
                }
                else if (this.selectedChartData === "daily") {
                    responses = await apiEndpointService.receiveVisitors(
                        [this.selectedLocationId],
                        dayjs(values[0]).format("YYYY-MM-DD"),
                        dayjs(values[1]).format("YYYY-MM-DD")
                    );
                    this.setChartData(responses[0].features);
                }
            }
            else {
                this.updateChartValues();
                this.showChart = false;
            }
            this.setLoader(false);
        },
        /**
         * sets the chart data for both bar and line charts
         * @param {Array} data the data to be used for the charts
         * @returns {void}
        */
        setChartData (data) {
            const barChartData = this.createChartData(data, "bar"),
                lineChartData = this.createChartData(data, "line");

            this.selectedChartData === "hourly" ? this.hourlyXLabels = barChartData.labels : this.dailyXLabels = barChartData.labels;

            this.updateChartValues(
                barChartData.datasets,
                lineChartData.datasets,
                barChartData.labels
            );
        },
        /**
         * updates the slider data based on the currently selected chart data
         * @returns {void}
        */
        updateSliderData () {
            this.setSliderData(this.chartdata?.bar?.labels?.map((label, index) => {
                return {
                    id: index,
                    name: label
                };
            }));
        },
        /**
         * the data for chart.js is created, based on
         * @param {Object} responseData the data responded by OGC-API
         * @param {String} chartType can be one of "bar" or "line"
         * @returns {Object} the formatted data to be shown in the chart
        */
        createChartData (responseData, chartType) {
            const labels = [],
                mondayToSaturdayData = [],
                sundayData = [];
            let datasets = {
                label: this.selectedChartData === "hourly" ? this.translate("additional:modules.tools.vpidashboard.unique.numberVisitorsHour") : this.translate("additional:modules.tools.vpidashboard.unique.numberVisitorsDay")
            };

            responseData.forEach((element) => {
                const date = dayjs(element.properties.datum).utc(true).locale(this.currentLocale),
                    labelXAxis = this.selectedChartData === "hourly"
                        ? date.format("dd, DD.MM.YYYY") + ` ${element.properties.startuhrzeit}:00`
                        : date.format("dd, DD.MM.YYYY"),
                    dataValue = this.selectedChartData === "hourly" ? element.properties.besucher : Math.ceil(element.properties.besucher / 100) * 100;

                labels.push(labelXAxis);

                mondayToSaturdayData.push(date.day() !== 0 ? dataValue : null);
                sundayData.push(date.day() === 0 ? dataValue : null);
            });

            datasets = [
                {
                    label: this.translate("additional:modules.tools.vpidashboard.tab.visitors.mondayToSaturday"),
                    data: mondayToSaturdayData,
                    backgroundColor: "#002680",
                    hoverOffset: 4,
                    fill: chartType === "bar",
                    tension: 0.1,
                    borderColor: "#002680"
                },
                {
                    label: this.translate("additional:modules.tools.vpidashboard.tab.visitors.sunday"),
                    data: sundayData,
                    backgroundColor: "#BED1EC",
                    hoverOffset: 4,
                    fill: chartType === "bar",
                    tension: 0.1,
                    borderColor: "#BED1EC"
                }
            ];

            return {
                labels: labels,
                datasets: datasets
            };
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
         * reacts on a change of year in first data card, changes data basis for monthly and daily charts
         * @param {Number} newYear index of new year
         * @returns {void}
         */
        yearHasChanged (newYear) {
            if (this.yearList.length > newYear) {
                this.$store.commit("Modules/VpiDashboard/setBarChartMonthlyData", this.currentlySelectedYear);
                this.$store.commit("Modules/VpiDashboard/setLineChartMonthlyData", this.currentlySelectedYear);
                this.$store.commit("Modules/VpiDashboard/setBarChartDailyData", {year: this.currentlySelectedYear, month: this.currentlySelectedMonth});
                this.$store.commit("Modules/VpiDashboard/setLineChartDailyData", {year: this.currentlySelectedYear, month: this.currentlySelectedMonth});
                if (!this.isVisitorsChartType) {
                    this.getCurrentChartsData();
                }
            }
        },
        /**
         * reacts on a change of month in second data card, changes data basis for daily charts
         * @param {Number} newMonth index of new month
         * @returns {void}
         */
        monthHasChanged (newMonth) {
            this.currentlySelectedMonth = newMonth;
            this.$store.commit("Modules/VpiDashboard/setBarChartDailyData", {year: this.currentlySelectedYear, month: newMonth});
            this.$store.commit("Modules/VpiDashboard/setLineChartDailyData", {year: this.currentlySelectedYear, month: newMonth});
            if (!this.isVisitorsChartType) {
                this.getCurrentChartsData();
            }
        }
    }
};
</script>

<template>
    <div class="tab">
        <div
            class="tab-panel h-100"
            role="tabpanel"
        >
            <div class="tab-content h100">
                <div class="row cards">
                    <DataCard
                        :title="translate('additional:modules.tools.vpidashboard.unique.avgVisitorsYear')"
                        detail="visitors"
                        :navigation="true"
                        :start-value-index="currentIndex"
                        @indexChanged="yearHasChanged"
                    />
                    <DataCard
                        :title="translate('additional:modules.tools.vpidashboard.unique.avgVisitorsMonth', { year: currentlySelectedYear })"
                        :navigation="true"
                        detail="monthly"
                        :subset-year="currentlySelectedYear"
                        @indexChanged="monthHasChanged"
                    />
                    <DataCard
                        :title="translate('additional:modules.tools.vpidashboard.unique.avgVisitorsDay', { year: currentlySelectedYear, month: translate('additional:modules.tools.vpidashboard.time.months', {returnObjects: true})[currentlySelectedMonth] })"
                        :navigation="true"
                        :subset-year="currentlySelectedYear"
                        :subset-month="currentlySelectedMonth"
                        detail="daily"
                    />
                </div>
                <div class="chartDataSelection">
                    <h2> {{ translate('additional:modules.tools.vpidashboard.unique.selectDataBase') }}</h2>
                    <select
                        id="chartDataSelector"
                        v-model="selectedChartDataComputed"
                        :aria-label="translate('additional:modules.tools.vpidashboard.unique.selectDataBase')"
                        class="form-select"
                    >
                        <option
                            v-for="(model, index) in possibleChartDatasets"
                            :key="index"
                            :value="model.id"
                        >
                            {{ translate(model.name, {year: currentlySelectedYear, month: translate('additional:modules.tools.vpidashboard.time.months', {returnObjects: true})[currentlySelectedMonth]}) }}
                        </option>
                    </select>
                    <div
                        v-if="showDatepicker"
                        class="pickADate"
                    >
                        <span> {{ translate('additional:modules.tools.vpidashboard.unique.selectDateRange') }} </span>
                        <DatePicker
                            v-model:value="dates"
                            :aria-label="translate('additional:modules.tools.vpidashboard.unique.date')"
                            :placeholder="translate('additional:modules.tools.vpidashboard.unique.date')"
                            type="date"
                            format="DD.MM.YYYY"
                            :disabled-date="disabledDates(selectedChartData === 'hourly' ? 8 : undefined)"
                            :range="true"
                            :multiple="false"
                            :show-week-number="true"
                            title-format="DD.MM.YYYY"
                            :lang="translate('common:libraries.vue2-datepicker.lang', {returnObjects: true})"
                        />
                    </div>
                </div>
                <div
                    v-if="showChart"
                    class="charts"
                >
                    <!-- Bar Chart -->
                    <div v-if="chartType === 'bar'">
                        <div
                            class="row chart bar"
                        >
                            <BarchartItem
                                :key="reloadChart"
                                :data="chartdata.bar"
                                :given-options="barChartOptions"
                            />
                        </div>
                    </div>
                    <!-- Line Chart -->
                    <div v-if="chartType === 'line'">
                        <div
                            class="row chart line"
                        >
                            <LinechartItem
                                :key="reloadChart"
                                :data="chartdata.line"
                                :given-options="lineChartOptions"
                            />
                        </div>
                    </div>
                </div>
                <div
                    class="charts chart-types select"
                >
                    <RangeSlider
                        v-if="showChart && sliderData?.length"
                        v-model="sliderSelectedValuesModel"
                        :data="sliderData"
                        :slider-title="getSliderTitle"
                        @change="reloadChart++"
                    />
                    <ChangeChartTypeButtons
                        :chart-type="chartType"
                        @updateChartType="setChartType"
                    />
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.cards {
    display: flex;
    justify-content: center;
    align-items: center;
    margin: 0;

    width: 100%;
    flex-wrap: wrap;
    gap: 1rem;
}

.pickADate {
    margin-top: 0.7rem;
}

.charts {
    margin: 0.5rem;
}

.chartDataSelection {
    margin-top: 1rem;
}
</style>
