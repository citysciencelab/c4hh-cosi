<script>
import {mapGetters, mapActions} from "vuex";
import LinechartItem from "@shared/modules/charts/components/LinechartItem.vue";
import FlatButton from "@shared/modules/buttons/components/FlatButton.vue";
import SpinnerItem from "@shared/modules/spinner/components/SpinnerItem.vue";
import thousandsSeparator from "@shared/js/utils/thousandsSeparator.js";

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
        /**
         * Returns the active chart theme (first theme from params.chartThemes).
         * @returns {Object|undefined} chart theme object or undefined when not available.
         */
        currentChartTheme () {
            // TODO chartTheme muss angepasst werden, wenn mehrere Charts in einem Tab vorhanden sind und es ein Dropdown gibt
            return this.params?.chartThemes[0];
        },
        /**
         * Indicates whether a right Y axis is configured for the current chart theme.
         * @returns {boolean} indicator for right axis
         */
        hasRightAxis () {
            const key = this.currentChartTheme?.chartParams?.yAxisRight;

            return Boolean(typeof key === "string" && key.trim().length > 0);
        },
        getLineChartTitle () {
            const prefix = this.oafSchema?.properties?.[this.currentChartTheme.queryParams?.literalFilters?.queryAttribute]?.title,
                  value = this.allAttributes?.[this.currentChartTheme.queryParams?.literalFilters?.queryAttribute];

            return prefix + " " + value;
        },
        /**
         * Chart.js options for the line chart, including scales and axis titles.
         *  overwrites default options set in the LinechartItem component
         * @returns {Object} options to use for the line chart
         */
        lineChartOptions () {
            const stepLeft = this.stepSizeLeft;
            const stepRight = this.stepSizeRight;

            return {
                plugins: {
                    title: {
                        display: true,
                        text: this.getLineChartTitle,
                        font: {
                            size: 20,
                            family: "'MasterPortalFont Bold', 'Arial Narrow', Arial, sans-serif"
                        }
                    }
                },
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
                            stepSize: stepLeft,
                            callback: function (value) {
                                const decimal = stepLeft < 0.05 ? 2 : 1;

                                return thousandsSeparator(value.toFixed(decimal));
                            }
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
                            stepSize: stepRight,
                            callback: function (value) {
                                const decimal = stepRight < 0.05 ? 2 : 1;

                                return thousandsSeparator(value.toFixed(decimal));
                            }
                        }
                    }
                }
            };
        },
        /**
         * Assembles chart data (labels and datasets) from statisticValues.
         * @returns {{labels: Array, datasets: Array}} chart data for LinechartItem
         */
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
                    backgroundColor: "#3C5F94",
                    borderColor: "#3C5F94",
                    borderWidth: 0,
                    pointStyle: false,
                    yAxisID: "yRight"
                });
            }

            return {
                labels: labels,
                datasets: datasets
            };
        },
        /**
         * Minimal numeric value for the configured left Y axis (derived from statisticValues).
         * @returns {number} minimal value
         */
        minDataValueLeft () {
            return this.findMinOrMax(this.currentChartTheme.chartParams?.yAxisLeft);
        },
        /**
         * Maximal numeric value for the configured left Y axis (derived from statisticValues).
         * @returns {number} maximal value
         */
        maxDataValueLeft () {
            return this.findMinOrMax(this.currentChartTheme.chartParams?.yAxisLeft, false);
        },
        /**
         * Step size chosen for left axis ticks based on the data range.
         * @returns {number} step size
         */
        stepSizeLeft () {
            const deltaLeft = this.maxDataValueLeft - this.minDataValueLeft;

            return this.findStepSizeFromDelta(deltaLeft);
        },
        /**
         * Minimal scale boundary for the left axis (rounded down with padding).
         * @returns {number} minimal scale boundary
         */
        minScaleLeft () {
            const padding = this.stepSizeLeft > 0.05 ? this.stepSizeLeft : 0;

            return Math.floor(this.minDataValueLeft * 10) / 10 - padding;
        },
        /**
         * Maximal scale boundary for the left axis (rounded up with padding).
         * @returns {number} maximal scale boundary
         */
        maxScaleLeft () {
            const padding = this.stepSizeLeft > 0.05 ? this.stepSizeLeft : 0;

            return Math.ceil(this.maxDataValueLeft * 10) / 10 + padding;
        },
        /**
         * Minimal numeric value for the configured right Y axis (derived from statisticValues).
         * @returns {number} minimal value
         */
        minDataValueRight () {
            return this.hasRightAxis ? this.findMinOrMax(this.currentChartTheme.chartParams?.yAxisRight) : 0;
        },
        /**
         * Maximal numeric value for the configured right Y axis (derived from statisticValues).
         * @returns {number} maximal value
         */
        maxDataValueRight () {
            return this.hasRightAxis ? this.findMinOrMax(this.currentChartTheme.chartParams?.yAxisRight, false) : 0;
        },
        /**
         * Minimal scale boundary for the right axis transformed from left axis scale.
         * @returns {number} minimal scale boundary
         */
        minScaleRight () {
            const tMin = this.applyRightAxisTransform(this.minScaleLeft);
            const tMax = this.applyRightAxisTransform(this.maxScaleLeft);

            return Math.min(tMin, tMax);
        },
        /**
         * Maximal scale boundary for the right axis transformed from left axis scale.
         * @returns {number} maximal scale boundary
         */
        maxScaleRight () {
            const tMin = this.applyRightAxisTransform(this.minScaleLeft);
            const tMax = this.applyRightAxisTransform(this.maxScaleLeft);

            return Math.max(tMin, tMax);
        },
        /**
         * Step size chosen for right axis ticks based on the data range.
         * @returns {number} step size
         */
        stepSizeRight () {
            const delta = this.maxScaleRight - this.minScaleRight;

            if (delta <= 0) {
                return this.stepSizeLeft;
            }
            return this.findStepSizeFromDelta(delta);
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
                      chartTheme = this.currentChartTheme,
                      queryAttribute = chartTheme?.queryParams?.literalFilters?.queryAttribute;

                const queryParams = {
                    url: oafParams?.url,
                    collections: oafParams?.collection,
                    queryField: queryAttribute,
                    queryProperties: chartTheme?.queryParams?.properties,
                    literalFilters: {
                        sortby: chartTheme?.queryParams?.literalFilters?.sortBy
                    },
                    queryValue: newAttributes[queryAttribute],
                    queryCrs: oafParams?.filterCRS,
                    dateField: chartTheme?.chartParams?.xAxis
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
        /**
         * Find the minimal or maximal numeric value for the provided axisKey inside statisticValues.
         * Non-numeric and missing values are ignored. Returns 0 if no valid numbers found.
         * @param {string} axisKey - property name in dataset.properties to evaluate
         * @param {boolean} [findMin=true] - when true find minimum, when false find maximum
         * @returns {number} minimal or maximal numeric value or 0 if none
         */
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
        /**
         * Determine the tick step size for an axis based on the provided data range (delta).
         * Uses the project's threshold rules:
         * - delta < 0.5  => 0.01
         * - delta < 1    => 0.1
         * - delta < 2    => 0.2
         * - otherwise    => 0.5
         *
         * @param {number} delta - Difference between maximum and minimum values on the axis.
         * @returns {number} Recommended step size for axis ticks.
         */
        findStepSizeFromDelta (delta) {
            if (delta < 0.5) {
                return 0.01;
            }
            else if (delta < 1) {
                return 0.1;
            }
            else if (delta < 2) {
                return 0.2;
            }
            return 0.5;
        },
        /**
         * Transform a left-axis numeric value to the right-axis scale using the
         * configured rightAxisTransform in the current chart theme.
         * Supported operators: "subtract", "add", "multiply".
         * If no transform is configured the input value is returned unchanged.
         * @param {number} leftValue - value on the left axis to transform
         * @returns {number} transformed value for the right axis
         */
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
    div.downloadArea {
        margin-top: 1rem;

        .spinner {
            margin-top: 0.5rem;
        }
    }

}
</style>
