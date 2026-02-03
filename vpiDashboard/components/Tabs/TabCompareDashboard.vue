<script>
import {mapGetters, mapActions, mapMutations} from "vuex";
import getters from "../../store/gettersVpiDashboard.js";
import actions from "../../store/actionsVpiDashboard.js";
import {disabledDates} from "../../utils/dateHelpers.js";
import dayjs from "dayjs";
import "dayjs/locale/de";
import weekOfYear from "dayjs/plugin/weekOfYear";
import objectSupport from "dayjs/plugin/objectSupport";
import aggregateData from "../../utils/aggregateData.js";
import apiEndpointService from "../../store/apiEndpointService.js";

// Components Import
import LinechartItem from "../../../../src/shared/modules/charts/components/LinechartItem.vue";
import BarchartItem from "../../../../src/shared/modules/charts/components/BarchartItem.vue";
import DatePicker from "vue-datepicker-next";
import "vue-datepicker-next/index.css";
import ChangeChartTypeButtons from "../ChangeChartTypeButtons.vue";
import RangeSlider from "../RangeSlider.vue";

// Load dayjs plugins
dayjs.extend(weekOfYear);
dayjs.extend(objectSupport);

export default {
    name: "TabCompareDashboard",
    components: {
        BarchartItem,
        LinechartItem,
        ChangeChartTypeButtons,
        DatePicker,
        RangeSlider
    },
    data () {
        return {
            chartType: "bar",
            chartdata: {
                bar: {
                    datasets: [
                        {
                            backgroundColor: "#BED1EC",
                            data: [1, 2, 3],
                            hoverOffset: 4,
                            label: "Label"
                        }
                    ]
                },
                line: {
                    datasets: [
                        {
                            backgroundColor: "#BED1EC",
                            data: [1, 2, 3],
                            hoverOffset: 4,
                            label: "Label"
                        }
                    ]
                }
            },
            possibleChartDatasets: [
                {
                    id: "hourly",
                    name: this.translate("additional:modules.tools.vpidashboard.unique.hourly"),
                    datePickerType: "date"
                },
                {
                    id: "daily",
                    name: this.translate("additional:modules.tools.vpidashboard.unique.daily"),
                    datePickerType: "date"
                },
                {
                    id: "ageGroup",
                    name: this.translate("additional:modules.tools.vpidashboard.tab.compare.dropdown.agegroup"),
                    datePickerType: "month"
                },
                {
                    id: "gender",
                    name: this.translate("additional:modules.tools.vpidashboard.tab.compare.dropdown.gender"),
                    datePickerType: "month"
                },
                {
                    id: "visitorTypes",
                    name: this.translate("additional:modules.tools.vpidashboard.tab.compare.dropdown.visitortypes"),
                    datePickerType: "month"
                }
            ],
            selectedChartData: "hourly",
            reloadChart: 1,
            dates: [],
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
             * @param {String} value selected value from dropdown, can be one of possibleChartDatasets.id
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
         * gets the dataset config for the active chart
         * @returns {Object} the config for the active chart
         */
        activeChartDatasetConfig () {
            return this.possibleChartDatasets.find(chart => chart.id === this.selectedChartDataComputed);
        },
        /**
         * gets the datePickerFormat for the active chart
         * @returns {Object} the datePickerFormat for the active chart
         */
        datePickerFormat () {
            return this.activeChartDatasetConfig.datePickerType === "date" ? "DD.MM.YYYY" : "MMM YYYY";
        }
    },
    watch: {
        dates (value) {
            this.dayDatepickerValueChanged(value);
        },
        async selectedLocationBId (value) {
            if (value) {
                this.dayDatepickerValueChanged(this.dates);
            }
        }
    },
    mounted () {
        this.setSelectCount(2);
    },
    unmounted () {
        this.setSelectCount(1);
    },
    methods: {
        disabledDates,
        ...mapActions("Modules/VpiDashboard", Object.keys(actions)),
        ...mapMutations("Modules/VpiDashboard", ["setSliderSelectedValues", "setSliderData", "setLoader", "setSelectCount"]),
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
            this.dayDatepickerValueChanged(this.dates);
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
         * @param {Date | Array} values can hold a single day or a date range, depending on the selected chart type
         * @returns {void}
         */
        async dayDatepickerValueChanged (values) {
            let responses = [];

            this.setLoader(true);

            if (values instanceof Date && this.activeChartDatasetConfig.datePickerType === "month") {
                const startDay = dayjs(values).format("YYYY-MM-DD"),
                    endDay = dayjs(values).endOf("month").format("YYYY-MM-DD");

                switch (this.selectedChartData) {
                    case "ageGroup":
                        responses = await apiEndpointService.receiveAgeGroups(
                            [this.selectedLocationId, this.selectedLocationBId], startDay, endDay);
                        break;
                    case "gender":
                        responses =
                            await apiEndpointService.receiveGenders(
                                [this.selectedLocationId, this.selectedLocationBId], startDay, endDay);
                        break;
                    case "visitorTypes":
                        responses =
                            await apiEndpointService.receiveOriginsCities(
                                [this.selectedLocationId, this.selectedLocationBId], startDay, endDay);
                        break;
                    default:
                        break;
                }
                this.setChartData(responses, true);
            }
            else if (values[0] && values[1] && this.activeChartDatasetConfig.datePickerType === "date") {
                const startDay = dayjs(values[0]).format("YYYY-MM-DD"),
                    endDay = dayjs(values[1]).format("YYYY-MM-DD");

                switch (this.selectedChartData) {
                    case "daily":
                        responses = await apiEndpointService.receiveVisitors(
                            [this.selectedLocationId, this.selectedLocationBId], startDay, endDay);
                        break;
                    case "hourly":
                        responses = await apiEndpointService.receiveVisitorsHourly(
                            [this.selectedLocationId, this.selectedLocationBId], startDay, endDay);
                        break;
                    default:
                        break;
                }
                this.setChartData(responses);
            }
            else {
                this.updateChartValues();
                this.showChart = false;
            }

            this.setLoader(false);
        },
        /**
         * sets the chart data for both bar and line charts
         * @param {Array} responses the data to be used for the charts
         * @param {Boolean} generateWeeklyAverages switch to use averages instead of the raw data
         * @returns {void}
         */
        setChartData (responses, generateWeeklyAverages = false) {
            let barChartData, lineChartData;

            if (!generateWeeklyAverages) {
                barChartData = this.createChartData(responses, "bar");
                lineChartData = this.createChartData(responses, "line");
            }
            else {
                barChartData = this.aggregateAndCreateChartData(responses, "bar");
                lineChartData = this.aggregateAndCreateChartData(responses, "line");
            }

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
         * The data is aggregated and prepared for chart.js, based on
         * @param {Object} responses the data responded by OGC-API
         * @param {String} chartType can be one of "bar" or "line"
         * @returns {Object} the formatted data to be shown in the chart
         */
        aggregateAndCreateChartData (responses, chartType) {
            const datasets = [];
            let groupByKey,
                labels;

            switch (this.activeChartDatasetConfig.id) {
                case "gender":
                    groupByKey = "geschlecht";
                    labels = this.gendersChartLabels.map(l => l.attrLookup);
                    break;
                case "ageGroup":
                    groupByKey = "altersklasse";
                    labels = this.ageGroupChartLabels;
                    break;
                case "visitorTypes":
                    groupByKey = "besuchertyp";
                    labels = this.originsChartLabels.map(l => l.attrLookup);
                    break;
                default:
                    return {
                        labels: [],
                        datasets: []
                    };
            }

            responses.forEach((response, index) => {
                const color = index === 0 ? "#df0000" : "#002680",
                    aggregatedData = aggregateData(
                        response.features,
                        date => date.getFullYear(),
                        date => date.getMonth(),
                        () => ({sum: 0, count: 0}),
                        groupByKey
                    );

                datasets.push({
                    data: [],
                    skipNull: true,
                    hoverOffset: 4,
                    fill: chartType === "bar",
                    backgroundColor: color,
                    label: this.uniqueGeoIdsWithNames.find(f => f.geoId === response.features[0].properties.geoid).name,
                    borderColor: color
                });

                Object.keys(aggregatedData).forEach(year => {
                    Object.keys(aggregatedData[year]).forEach(month => {
                        Object.keys(aggregatedData[year][month]).sort().forEach(ageGroupKey => {
                            datasets[index].data.push(Math.round((aggregatedData[year][month][ageGroupKey].sum / dayjs.utc({y: year, M: month}).daysInMonth()) * 7));
                        });
                    });
                });
            });

            return {
                labels,
                datasets
            };
        },
        /**
         * the data for chart.js is created, based on
         * @param {Object} responses the data responded by OGC-API
         * @param {String} chartType can be one of "bar" or "line"
         * @returns {Object} the formatted data to be shown in the chart
         */
        createChartData (responses, chartType) {
            const labels = new Set(),
                locations = new Set(),
                datasets = [];
            let presentation_data,
                color;

            responses.forEach((response, index) => {
                presentation_data = [];
                response.features.forEach((feature) => {
                    const date = dayjs(feature.properties.datum).utc(true).locale(this.currentLocale),
                        labelXAxis = this.selectedChartData === "hourly"
                            ? date.format("dd, DD.MM.YYYY") + ` ${feature.properties.startuhrzeit}:00`
                            : date.format("dd, DD.MM.YYYY");

                    labels.add(labelXAxis);
                    locations.add(this.uniqueGeoIdsWithNames.find(f => f.geoId === feature.properties.geoid).name);
                    presentation_data.push(this.selectedChartData === "hourly" ? feature.properties.besucher : Math.ceil(feature.properties.besucher / 100) * 100);
                });

                color = index === 0 ? "#df0000" : "#002680";

                if (chartType === "bar") {
                    datasets.push({
                        data: presentation_data,
                        hoverOffset: 4,
                        backgroundColor: color,
                        label: [...locations][index]
                    });
                }
                else if (chartType === "line") {
                    datasets.push({
                        data: presentation_data,
                        fill: false,
                        borderColor: color,
                        tension: 0.1,
                        label: [...locations][index]
                    });
                }
            });

            return {
                labels: [...labels],
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
            <div
                v-if="!selectedLocationBId"
                class="tab-content h100"
            >
                <h2> {{ translate('additional:modules.tools.vpidashboard.compare.selectLocationB') }}</h2>
            </div>
            <div
                v-else
                class="tab-content h100"
            >
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
                            {{ translate(model.name) }}
                        </option>
                    </select>
                    <div
                        class="pickADate"
                    >
                        <span> {{ translate('additional:modules.tools.vpidashboard.unique.selectDateRange') }} </span>
                        <DatePicker
                            v-model:value="dates"
                            :aria-label="translate('additional:modules.tools.vpidashboard.unique.date')"
                            :placeholder="translate('additional:modules.tools.vpidashboard.unique.date')"
                            :type="activeChartDatasetConfig.datePickerType"
                            :format="datePickerFormat"
                            :disabled-date="disabledDates(activeChartDatasetConfig.id === 'hourly' ? 8 : undefined)"
                            :range="activeChartDatasetConfig.datePickerType ==='date'"
                            :multiple="false"
                            :show-week-number="true"
                            :title-format="datePickerFormat"
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
                                :given-options="{...barChartOptions, scales: {x:{...barChartOptions.scales.x, stacked:false}}}"
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
                        v-if="showChart && sliderData?.length && activeChartDatasetConfig.datePickerType ==='date'"
                        v-model="sliderSelectedValuesModel"
                        :data="sliderData"
                        :slider-title="getSliderTitle"
                        @change="reloadChart++"
                    />
                    <ChangeChartTypeButtons
                        v-if="showChart"
                        :chart-type="chartType"
                        @updateChartType="setChartType"
                    />
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
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
