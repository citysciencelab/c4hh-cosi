<script>
import {mapGetters, mapActions} from "vuex";
import LinechartItem from "@shared/modules/charts/components/LinechartItem.vue";
import FlatButton from "@shared/modules/buttons/components/FlatButton.vue";
import SpinnerItem from "@shared/modules/spinner/components/SpinnerItem.vue";

export default {
    name: "TabGraphics",
    components: {
        FlatButton,
        SpinnerItem,
        LinechartItem
    },
    props: {
        params: {
            type: Object,
            required: true
        },
        allAttributes: {
            type: Object,
            required: true
        }
    },
    computed: {
        ...mapGetters("Modules/WaterStatistics", [
            "statisticValues",
            "oafSchema",
            "dataLoading"
        ]),
        ...mapGetters("Maps", [
            "projectionCode"
        ]),
        currentChartTheme () {
            // TODO chartTheme muss angepasst werden, wenn mehrere Charts in einem Tab vorhanden sind und es ein Dropdown gibt
            return this.params?.chartThemes[0];
        },
        hasRightAxis () {
            return this.currentChartTheme.chartParams?.yAxisRight && typeof this.currentChartTheme.chartParams?.yAxisRight === "string";
        },
        lineChartOptions () {
            return {
                scales: {
                    y: {
                        type: "linear",
                        display: true,
                        position: "left",
                        title: {
                            display: true,
                            text: this.oafSchema?.properties?.[this.currentChartTheme.chartParams.yAxisLeft]?.title ?? ""
                        },
                        min: this.minScaleLeft,
                        max: this.maxScaleLeft,
                        ticks: {
                            precision: 2,
                            stepSize: this.stepSizeLeft
                        }
                    },
                    yRight: {
                        type: "linear",
                        reverse: true,
                        display: this.hasRightAxis,
                        position: "right",
                        title: {
                            display: true,
                            text: this.oafSchema?.properties?.[this.currentChartTheme.chartParams.yAxisRight]?.title ?? ""
                        },
                        min: this.minScaleRight,
                        max: this.maxScaleRight,
                        grid: {
                            drawOnChartArea: false
                        },
                        ticks: {
                            precision: 2,
                            stepSize: this.stepSizeLeft
                        }
                    }
                }
            };
        },
        chartData () {
            const labels = [],
                  left_data = [],
                  right_data = [],
                  datasets = [],
                  axisParameter = this.currentChartTheme.chartParams;

            if (this.statisticValues && this.statisticValues.length) {
                this.statisticValues.forEach((dataset) => {
                    labels.push(dataset.properties[axisParameter?.xAxis]);
                    left_data.push(dataset.properties[axisParameter?.yAxisLeft]);
                    if (this.hasRightAxis) {
                        right_data.push(dataset.properties[axisParameter?.yAxisRight]);
                    }
                });
            }

            datasets.push({
                label: this.lineChartOptions.scales.y.title.text,
                data: left_data,
                hoverOffset: 4,
                backgroundColor: "#3C5F9433",
                borderColor: "#3C5F94",
                borderWidth: 2,
                pointStyle: false,
                fill: {value: this.minScaleLeft},
                yAxisID: "y"
            });

            if (this.hasRightAxis) {
                datasets.push({
                    label: this.lineChartOptions.scales.yRight.title.text,
                    data: right_data,
                    hoverOffset: 4,
                    backgroundColor: "#00FFFF",
                    borderColor: "#00FFFF",
                    borderWidth: 2,
                    pointStyle: false,
                    yAxisID: "yRight"
                });
            }

            return {
                labels: labels,
                datasets: datasets
            };
        },
        minDataValueLeft () {
            return this.findMinOrMax(this.currentChartTheme.chartParams?.yAxisLeft);
        },
        maxDataValueLeft () {
            return this.findMinOrMax(this.currentChartTheme.chartParams?.yAxisLeft, false);
        },
        stepSizeLeft () {
            const deltaLeft = this.maxDataValueLeft - this.minDataValueLeft;

            if (deltaLeft < 0.5) {
                return 0.01;
            }
            else if (deltaLeft < 1) {
                return 0.1;
            }
            else if (deltaLeft < 2) {
                return 0.2;
            }
            return 0.5;
        },
        minScaleLeft () {
            return Math.floor(this.minDataValueLeft) - this.stepSizeLeft;
        },
        maxScaleLeft () {
            return Math.ceil(this.maxDataValueLeft) + this.stepSizeLeft;
        },
        minDataValueRight () {
            return this.hasRightAxis ? this.findMinOrMax(this.currentChartTheme.chartParams?.yAxisRight) : 0;
        },
        maxDataValueRight () {
            return this.hasRightAxis ? this.findMinOrMax(this.currentChartTheme.chartParams?.yAxisRight, false) : 0;
        },
        minScaleRight () {
            return this.applyRightAxisTransform(this.minScaleLeft);
        },
        maxScaleRight () {
            return this.applyRightAxisTransform(this.maxScaleLeft);
        }
    },
    watch: {
        allAttributes: {
            deep: true,
            handler (newAttributes, oldAttributes) {
                if (newAttributes === oldAttributes) {
                    return;
                }

                const oafParams = this.params?.oafParams,
                      // TODO chartTheme muss angepasst werden, wenn mehrere Charts in einem Tab vorhanden sind und es ein Dropdown gibt
                      chartParams = this.params?.chartThemes?.[0],
                      queryAttribute = chartParams?.queryParams?.literalFilters?.queryAttribute;

                const queryParams = {
                    url: oafParams?.url,
                    collections: oafParams?.collection,
                    queryField: queryAttribute,
                    queryProperties: chartParams?.queryParams?.properties,
                    literalFilters: {
                        sortby: chartParams?.queryParams?.literalFilters?.sortBy
                    },
                    queryValue: newAttributes[queryAttribute],
                    queryCrs: oafParams?.filterCRS,
                    dateField: chartParams?.chartParams?.xAxis
                };

                this.queryOaf({params: queryParams});
            },
            immediate: true
        }
    },
    methods: {
        ...mapActions("Modules/WaterStatistics", [
            "queryOaf"
        ]),
        findMinOrMax (axisKey, findMin = true) {
            if (!axisKey || !this.statisticValues || !this.statisticValues.length) {
                return 0;
            }

            const infinityValue = findMin ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY;
            let minOrMaxValue = infinityValue;

            this.statisticValues.forEach((dataset) => {
                const raw = dataset?.properties?.[axisKey],
                      num = typeof raw === "number" ? raw : Number.parseFloat(raw);

                if (!Number.isNaN(num)) {
                    if (findMin && num < minOrMaxValue) {
                        minOrMaxValue = num;
                    }
                    else if (!findMin && num > minOrMaxValue) {
                        minOrMaxValue = num;
                    }
                }
            });

            return minOrMaxValue === infinityValue ? 0 : minOrMaxValue;
        },
        applyRightAxisTransform (leftValue) {
            const transform = this.currentChartTheme.chartParams?.rightAxisTransform;

            if (!transform) {
                return leftValue;
            }
            const reference = this.allAttributes?.[transform.referenceAttribute] ?? 0,
                  factor = transform.factor ?? 1;

            switch (transform.operator) {
                case "subtract":
                    return reference - (leftValue * factor);
                case "add":
                    return reference + (leftValue * factor);
                case "multiply":
                    return reference * leftValue * factor;
                default:
                    return leftValue;
            }
        },
        csvDownload () {
            const oafParams = this.params?.oafParams,
                  chartParams = this.params?.chartThemes?.[0],
                  queryAttribute = chartParams?.queryParams?.literalFilters?.queryAttribute;

            const queryParams = {
                url: oafParams?.url,
                collections: oafParams?.collection,
                queryField: queryAttribute,
                queryProperties: this.getCsvParams(),
                literalFilters: {
                    sortby: chartParams?.queryParams?.literalFilters?.sortBy
                },
                queryValue: this.allAttributes[queryAttribute],
                queryCrs: oafParams?.filterCRS,
                dateField: chartParams?.chartParams?.xAxis
            };

            this.queryOaf({params: queryParams, queryPurpose: "downloadCsv", epsg: this.projectionCode});
        },

        /**
         * Returns the CSV parameter names based on the OAF schema and chart parameters.
         * @returns {string[]} Array of CSV parameter names
         */
        getCsvParams () {
            const chartParams = this.params?.chartThemes?.[0];

            if (chartParams?.csvParams?.length) {
                return chartParams?.csvParams;
            }

            const csvParamsToExclude = chartParams?.excludeCsvParams,
                  allProperties = Object.keys(this.oafSchema?.properties || {}),
                  csvParams = csvParamsToExclude?.length
                      ? allProperties.filter(p => !csvParamsToExclude.includes(p))
                      : allProperties;

            return csvParams;
        }
    }
};
</script>

<template>
    <div
        id="TabGraphics"
        class="row chart line"
    >
        <LinechartItem
            :data="chartData"
            :given-options="lineChartOptions"
        />

        <div class="downloadArea d-flex">
            <FlatButton
                aria="Alle Daten des aktuell dargestellten Zeitbereichs im CSV-Format herunterladen"
                icon="bi-cloud-arrow-down-fill"
                title="Alle Daten des aktuell dargestellten Zeitbereichs im CSV-Format herunterladen"
                :interaction="() => csvDownload()"
                text="Download CSV"
            />

            <SpinnerItem
                v-if="dataLoading"
                custom-class="spinner"
                class="ms-3"
            />
        </div>
    </div>
</template>

<style lang="scss" scoped>
#TabGraphics {
    .diagram {
        height: 400px;
        width: 100%;
        background-color: #f5f5f5;
        border: 1px solid #ccc;
        margin-bottom: 20px;
    }

    div.downloadArea {
        margin-top: 1rem;

        .spinner {
            margin-top: 0.5rem;
        }
    }

}
</style>
