<script>
import {mapGetters, mapActions, mapMutations} from "vuex";
import getters from "../../store/gettersVpiDashboard.js";
import actions from "../../store/actionsVpiDashboard.js";
import dayjs from "dayjs";
import {disabledDates} from "../../utils/dateHelpers.js";
import apiEndpointService from "../../store/apiEndpointService.js";

// Components Import
import LinechartItem from "../../../../src/shared/modules/charts/components/LinechartItem.vue";
import BarchartItem from "../../utils/BarchartItem.vue";
import PiechartItem from "../../../../src/shared/modules/charts/components/PiechartItem.vue";
import DataCardPaginator from "../DataCardPaginator.vue";
import ChangeChartTypeButtons from "../ChangeChartTypeButtons.vue";
import DatePicker from "vue-datepicker-next";
import RangeSlider from "../RangeSlider.vue";

export default {
    name: "TabGenders",
    components: {
        RangeSlider,
        DatePicker,
        LinechartItem,
        BarchartItem,
        PiechartItem,
        DataCardPaginator,
        ChangeChartTypeButtons
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
                },
                pie: {
                    datasets: [
                        {
                            backgroundColor: [],
                            data: [],
                            hoverOffset: 4,
                            label: "Label"
                        }
                    ]
                }
            },
            pieChartOptions: {
                legend: {
                    display: false
                },
                aspectRatio: 3,
                animation: false,
                plugins: {
                    tooltip: {
                        callbacks: {
                            // Creates a PieChart Tooltip like "weiblich: 30.9%"
                            label: (tooltipItem) => {
                                return `${tooltipItem.label}: ${tooltipItem.parsed}%`;
                            }
                        }
                    }
                }
            },
            possibleChartDatasets: [
                {
                    name: "additional:modules.tools.vpidashboard.unique.monthlyOverview",
                    chart: "monthlyoverview"
                },
                {
                    name: "additional:modules.tools.vpidashboard.unique.selectedDateRange",
                    chart: "dailyoverview"
                }
            ],
            reloadChart: 1,
            showChart: false,
            noDataAvailable: "",
            selectedChartData: "monthlyoverview",
            showDatepicker: false,
            dates: []
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
            await this.getGendersData();
            this.getCurrentChartsData();
        }
    },
    mounted () {
        this.fillInitialChartData();
    },
    methods: {
        disabledDates,
        ...mapActions("Modules/VpiDashboard", Object.keys(actions)),
        ...mapMutations("Modules/VpiDashboard", ["setLoader", "setSliderSelectedValues", "setSliderData", "setGendersDailyData", "setGendersDailyDataLine", "setGendersDailyXLabels", "setCurrentIndex"]),
        /**
         * Create the chart data for first overview
         * @returns {void}
         */
        async fillInitialChartData () {
            await this.getGendersData();
            this.getCurrentChartsData();
        },
        /**
         * when the user selected a date, the data need to be requested from OGC-API and the chart data need to be created
         * @param {String | Array} values can hold a single day or a date range, depending on the selected chart type
         * @returns {void}
         */
        async dayDatepickerValueChanged (values) {
            if (values[0] && values[1]) {
                this.setLoader(true);
                const responses = await apiEndpointService.receiveGenders(
                    [this.selectedLocationId],
                    dayjs(values[0]).format("YYYY-MM-DD"),
                    dayjs(values[1]).format("YYYY-MM-DD")
                );

                this.setChartData(responses[0].features);
            }
            else {
                this.updateChartValues();
                this.showChart = false;
            }

            this.setLoader(false);
        },
        /**
         * the data for chart.js is created, based on
         * @param {Object} responseData the data responded by OGC-API
         * @param {String} chartType can be "bar" or "line"
         * @returns {Object} the formatted data to be shown in the chart
         */
        createChartData (responseData, chartType) {
            const tempData = [],
                xLabels = new Set();

            responseData.forEach((element) => {
                this.gendersChartLabels.forEach((labelObj, index) => {

                    if (!tempData[index]) {
                        tempData[index] = {
                            data: [],
                            hoverOffset: 4,
                            fill: chartType === "bar",
                            backgroundColor: labelObj.color,
                            label: this.$t(labelObj.text),
                            borderColor: labelObj.color
                        };
                    }

                    if (element.properties.geschlecht === labelObj.attrLookup) {
                        tempData[index].data.push(element.properties.besucher);
                    }
                    xLabels.add(dayjs(element.properties.datum).locale(this.currentLocale).format("dd, DD.MM.YYYY"));
                });
            });
            chartType === "bar" ? this.setGendersDailyData(tempData) : this.setGendersDailyDataLine(tempData);
            this.setGendersDailyXLabels([...xLabels]);
        },
        /**
         * get the chart data from the store for the selected year
         * @returns {void}
         */
        async getCurrentChartsData () {
            this.chartdata.pie.datasets = this.gendersYearlyData[this.currentlySelectedYear];
            this.chartdata.pie.labels = this.gendersChartLabels.map((label) => this.$t(label.text));

            switch (this.selectedChartData) {
                case "dailyoverview":
                    this.dayDatepickerValueChanged(this.dates);
                    this.showDatepicker = true;
                    break;
                case "monthlyoverview":
                    this.updateChartValues(
                        this.gendersMonthlyData[this.currentlySelectedYear],
                        this.gendersMonthlyDataLine[this.currentlySelectedYear],
                        this.gendersMonthlyXLabels
                    );
                    break;
                default:
                    this.updateChartValues();
                    break;
            }

            if (!this.chartdata.pie.datasets || this.chartdata.pie.datasets.length === 0) {
                this.noDataAvailable = this.$t("additional:modules.tools.vpidashboard.tab.noData");
            }
            else {
                this.noDataAvailable = "";
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
         * prepares the change of the data base of the shown chart
         * @returns {void}
         */
        switchChart () {
            this.showDatepicker = false;
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
         * sets the chart data for both bar and line charts
         * @param {Array} features the data to be used for the charts
         * @returns {void}
         */
        setChartData (features) {
            this.createChartData(features, "bar");
            this.createChartData(features, "line");
            this.updateChartValues(this.gendersDailyData, this.gendersDailyDataLine, this.gendersDailyXLabels);
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
         * translates the given key, checkes if the key exists and throws a console warning if not
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
                    <h2>
                        {{ $t("additional:modules.tools.vpidashboard.tab.gender.chartTitle") }}
                    </h2>
                    <div class="charts">
                        <!-- Pie Chart -->
                        <div class="piechart">
                            <div
                                class="row chart pie"
                            >
                                <h4> {{ $t("additional:modules.tools.vpidashboard.tab.gender.chartTitle") }} </h4>
                                <DataCardPaginator
                                    :paginator-data="yearList"
                                    :start-index="currentIndex"
                                    @pager="changeIndex"
                                />
                                <span
                                    v-if="noDataAvailable !== ''"
                                    class="noDataAvailableMessage"
                                >
                                    {{ noDataAvailable }}
                                </span>
                                <PiechartItem
                                    v-if="!noDataAvailable"
                                    ref="pieChart"
                                    :key="reloadChart"
                                    :data="chartdata.pie"
                                    :given-options="pieChartOptions"
                                    class="pieChart"
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
                                >
                                    {{ translate(model.name, {year: currentlySelectedYear}) }}
                                </option>
                            </select>
                            <div
                                v-if="showDatepicker"
                                class="pickADate"
                            >
                                <span> {{ translate("additional:modules.tools.vpidashboard.unique.selectDateRange") }}</span>
                                <DatePicker
                                    v-model:value="dates"
                                    :aria-label="translate('additional:modules.tools.vpidashboard.unique.date')"
                                    :placeholder="translate('additional:modules.tools.vpidashboard.unique.date')"
                                    type="date"
                                    format="DD.MM.YYYY"
                                    :disabled-date="disabledDates()"
                                    :range="true"
                                    :multiple="false"
                                    :show-week-number="true"
                                    title-format="DD.MM.YYYY"
                                    :lang="translate('common:libraries.vue2-datepicker.lang', {returnObjects: true})"
                                />
                            </div>
                        </div>
                        <!-- Bar Chart -->
                        <div v-if="chartType === 'bar'">
                            <div
                                class="row chart bar"
                            >
                                <BarchartItem
                                    v-if="showChart && (selectedChartData === 'monthlyoverview' || dates.length !== 0)"
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
                    <div class="charts chart-types select">
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
    </div>
</template>

<style scoped>
h3 {
    margin: 0 0 1rem 0;
}

.chart {
    margin: 0.5rem 0 0 0;
}

.charts .noDataAvailableMessage {
    font-size: 16px;
    font-weight: normal;
}

.piechart {
    margin-bottom: 30px;
}

h4 {
    font-size: 0.7rem;
    text-align: center;
    margin-bottom: 10px;
}

.pickADate {
    margin-top: 0.7rem;
}

.chartDataSelection {
    margin-top: 1rem;
}
</style>
