<script>
import {mapGetters, mapActions, mapMutations} from "vuex";
import getters from "../../store/gettersVpiDashboard.js";
import actions from "../../store/actionsVpiDashboard.js";
import {disabledDates} from "../../utils/dateHelpers.js";
import dayjs from "dayjs";
import "dayjs/locale/de";
import axios from "axios";
import {Config} from "../../config.js";
import apiEndpointService from "../../store/apiEndpointService.js";

// Components Import
import LinechartItem from "../../../../src/shared/modules/charts/components/LinechartItem.vue";
import BarchartItem from "../../../../src/shared/modules/charts/components/BarchartItem.vue";
import DataCard from "../DataCard.vue";
import DataCardPaginator from "../DataCardPaginator.vue";
import DatePicker from "vue-datepicker-next";
import "vue-datepicker-next/index.css";
import ChangeChartTypeButtons from "../ChangeChartTypeButtons.vue";


export default {
    name: "TabOrigins",
    components: {
        DataCard,
        LinechartItem,
        BarchartItem,
        DatePicker,
        DataCardPaginator,
        ChangeChartTypeButtons
    },
    data () {
        return {
            chartType: "bar",
            chartdata: {
                labels: [],
                bar: {
                    datasets: [
                        {
                            backgroundColor: "#FD763B",
                            data: [1, 2, 3],
                            hoverOffset: 4,
                            label: "Label"
                        }
                    ]
                },
                line: {
                    datasets: [
                        {
                            backgroundColor: "#FD763B",
                            data: [1, 2, 3],
                            hoverOffset: 4,
                            label: "Label"
                        }
                    ]
                }
            },
            possibleChartDatasets: [
                { // Überblick ausblenden solange das Chart nicht korrekt aufdatiert wird.
                    name: "additional:modules.tools.vpidashboard.unique.monthlyOverview",
                    chart: "monthlyoverview",
                    disabled: false
                },
                { // #PLZ Postleitzahl ausblenden solange der Dienst nicht funktioniert.
                    name: "additional:modules.tools.vpidashboard.tab.origins.chartLabels.numberVisitorsDayPostalCode",
                    chart: "postalCode",
                    disabled: false
                },
                {
                    name: "additional:modules.tools.vpidashboard.tab.origins.chartLabels.overnightLocations",
                    chart: "overnight",
                    disabled: false
                },
                {
                    name: "additional:modules.tools.vpidashboard.tab.origins.chartLabels.roamer",
                    chart: "international",
                    disabled: false
                }
            ],
            selectedChartData: "monthlyoverview",
            // selectedChartData: "overnight",
            showDatepicker: false,
            reloadChart: 1,
            dates: [],
            showChart: false,
            roamerFormattedMapping: {}
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
        indexAxis () {
            return this.selectedChartData === "monthlyoverview" ? "x" : "y";
        },
        barChartOptions () {
            return {
                indexAxis: this.indexAxis,
                scales: {
                    x: {
                        stacked: true
                    },
                    y: {
                        beginAtZero: true,
                        stacked: true,
                        ticks: {
                            callback: function (value) {
                                return this.getLabelForValue(value);
                            }
                        }
                    }
                }
            };
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
            await this.getOriginsCities();
            this.fillInitialChartData();
        }
    },
    async created () {
        try {
            const response = await axios.get(Config.roamerFormatted);

            this.roamerFormattedMapping = response.data;
        }
        catch { /* empty */ }
        await this.getOriginsCities();
        this.fillInitialChartData();
    },
    methods: {
        disabledDates,
        ...mapActions("Modules/VpiDashboard", Object.keys(actions)),
        ...mapMutations("Modules/VpiDashboard", ["setLoader", "setCurrentIndex"]),
        /**
         * Create the chart data for first overview
         * @returns {void}
        */
        async fillInitialChartData () {
            this.dayDatepickerValueChanged(this.dates);
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
         * reacts on the change of the year paginator
         * @param {String} index selected page to be shown
         * @returns {void}
         */
        async changeIndex (index) {
            this.setCurrentIndex(index);
            this.getCurrentChartsData();
        },
        /**
         * prepares the change of the data based of the shown chart
         * if a visitors chart type (urges the user to pick a date / date range before) is selected, the date picker is prepared
         * otherwise the data are selected and the chart change is started
         * @returns {void}
        */
        switchChart () {
            this.showDatepicker = false;
            this.dayDatepickerValueChanged(this.dates);
            this.getCurrentChartsData();
        },
        /**
         * get the chart data from the store for the selected year
         * @returns {void}
        */
        getCurrentChartsData () {
            switch (this.selectedChartData) {
                case "monthlyoverview":
                    this.updateChartValues(
                        this.allOriginsMonthlyData[this.currentlySelectedYear],
                        this.allOriginsMonthlyDataLine[this.currentlySelectedYear],
                        this.originsMonthlyXLabels
                    );
                    this.showDatepicker = false;
                    break;
                case "postalCode":
                case "overnight":
                case "international":
                    this.showDatepicker = true;
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
                switch (this.selectedChartData) {
                    case "postalCode":
                        await apiEndpointService.receiveOriginsPostalCode(
                            this.selectedLocationId,
                            dayjs(values[0]).format("YYYY-MM-DD"),
                            dayjs(values[1]).format("YYYY-MM-DD")
                        ).then((data) => {
                            this.setChartData(data.features);
                        });
                        break;
                    case "overnight":
                        responses = await apiEndpointService.receiveOriginsCities(
                            [this.selectedLocationId],
                            dayjs(values[0]).format("YYYY-MM-DD"),
                            dayjs(values[1]).format("YYYY-MM-DD")
                        );

                        this.setChartData(responses[0].features);

                        break;
                    case "international":
                        await apiEndpointService.receiveOriginsInternational(
                            this.selectedLocationId,
                            dayjs(values[0]).format("YYYY-MM-DD"),
                            dayjs(values[1]).format("YYYY-MM-DD")
                        ).then((data) => {
                            this.setChartData(data.features);
                        });
                        break;
                    default:
                        this.setLoader(false);
                        return;
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
         * @param {Array} features the data to be used for the charts
         * @returns {void}
        */
        setChartData (features) {
            const chartData = this.createChartData(features);

            this.updateChartValues(
                chartData.datasets,
                chartData.datasets,
                chartData.labels
            );
        },
        /**
         * the data for chart.js is created, based on
         * @param {Object} responseData the data responded by OGC-API
         * @returns {Object} the formatted data to be shown in the chart
        */
        createChartData (responseData) {
            const labels = [],
                presentation_data = [],
                aggregatedData = {},
                datasets = [];
            let labelKey;

            switch (this.selectedChartData) {
                case "postalCode":
                    labelKey = "plz";
                    break;
                case "overnight":
                    labelKey = "stadt_landkreis";
                    break;
                case "international":
                    labelKey = "roamer";
                    break;
                default:
                    return {labels: [], datasets: []};
            }

            responseData.forEach((element) => {
                const label = element.properties[labelKey];

                let combinedLabel = this.selectedChartData === "postalCode" ? `${label} | ${element.properties.stadtteilname}` : label;

                if (this.selectedChartData === "international") {
                    combinedLabel = this.roamerFormattedMapping[label] || label;
                }

                if (!aggregatedData[combinedLabel]) {
                    aggregatedData[combinedLabel] = 0;
                }

                aggregatedData[combinedLabel] += element.properties.besucher;
            });

            const sortedData = Object.entries(aggregatedData)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 10),
                [largestLabel, largestValue] = sortedData.shift();

            labels.push(largestLabel);

            sortedData.forEach(([combinedLabel, visitors]) => {
                labels.push(combinedLabel);
                presentation_data.push(visitors);
            });

            datasets.push({
                label: this.translate("additional:modules.tools.vpidashboard.tab.origins.highestValue"),
                data: [largestValue],
                hoverOffset: 4,
                backgroundColor: "#BED1EC",
                borderColor: "#BED1EC"
            });

            datasets.push({
                label: this.translate("additional:modules.tools.vpidashboard.tab.origins.otherValues"),
                data: [null, ...presentation_data],
                hoverOffset: 4,
                backgroundColor: "#002680",
                borderColor: "#002680"
            });

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
                <div class="row">
                    <div class="cards">
                        <DataCardPaginator
                            :paginator-data="yearList"
                            :start-index="currentIndex"
                            @pager="changeIndex"
                        />
                        <DataCard
                            :title="translate('additional:modules.tools.vpidashboard.tab.origins.cardLabels.residentsPerWeek')"
                            :subtitle="translate('additional:modules.tools.vpidashboard.tab.origins.footnote.hamburger')"
                            detail="visitorTypeResidentsPerWeek"
                        />
                        <DataCard
                            :title="translate('additional:modules.tools.vpidashboard.tab.origins.cardLabels.commutersPerWeek')"
                            :subtitle="translate('additional:modules.tools.vpidashboard.tab.origins.footnote.pendler')"
                            detail="visitorTypeCommutersPerWeek"
                        />
                        <DataCard
                            :title="translate('additional:modules.tools.vpidashboard.tab.origins.cardLabels.touristsPerWeek')"
                            :subtitle="translate('additional:modules.tools.vpidashboard.tab.origins.footnote.touristen')"
                            detail="visitorTypeTouristsPerWeek"
                        />
                    </div>
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
                            :value="model.chart"
                            :disabled="model.disabled"
                        >
                            {{ translate(model.name, {year: currentlySelectedYear}) }}
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
                            :disabled-date="disabledDates(selectedChartData === 'postalCode' ? 1 : undefined)"
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
                    <div v-if="chartType === 'line' && selectedChartData === 'monthlyoverview'">
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
                    v-if="selectedChartData === 'monthlyoverview'"
                    class="charts chart-types select"
                >
                    <ChangeChartTypeButtons
                        :chart-type="chartType"
                        @updateChartType="setChartType"
                    />
                </div>
                <div v-if="selectedChartData === 'postalCode' && showChart">
                    {{ $t("additional:modules.tools.vpidashboard.tab.origins.footnote.plz") }}
                </div>
                <div v-if="selectedChartData === 'overnight' && showChart">
                    {{ $t("additional:modules.tools.vpidashboard.tab.origins.footnote.overnight") }}
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
