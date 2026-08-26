<script>
import {mapGetters, mapActions, mapMutations} from "vuex";
import LinechartItem from "@shared/modules/charts/components/LinechartItem.vue";
import FlatButton from "@shared/modules/buttons/components/FlatButton.vue";
import SpinnerItem from "@shared/modules/spinner/components/SpinnerItem.vue";
import thousandsSeparator from "@shared/js/utils/thousandsSeparator.js";
import TabGraphicsDisclaimerModal from "./TabGraphicsDisclaimerModal.vue";

export default {
    name: "TabGraphics",
    components: {
        FlatButton,
        SpinnerItem,
        LinechartItem,
        TabGraphicsDisclaimerModal
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
    data () {
        return {
            percentile: null,
            filterRange: "last-year",
            rangeStartDate: undefined,
            rangeEndDate: undefined,
            filterStartMonth: undefined,
            filterEndMonth: undefined,
            filterStartYear: undefined,
            filterEndYear: undefined,
            showDisclaimerModal: false
        };
    },
    computed: {
        ...mapGetters("Modules/WaterStatistics", [
            "statisticValues",
            "oafSchema",
            "dataLoading",
            "percentiles",
            "dateRange",
            "allData"
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
        /**
         * Indicates whether a disclaimer is configured.
         * @returns {boolean} indicator for disclaimer
         */
        hasDisclaimer () {
            return Boolean(
                this.params?.disclaimer &&
                    typeof this.params?.disclaimer === "object" &&
                    Object.hasOwn(this.params.disclaimer, "text") &&
                    Object.hasOwn(this.params.disclaimer, "data")
            );
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
            const deltaLeft = this.maxScaleLeft - this.minScaleLeft;
            const deltaRight = this.maxScaleRight - this.minScaleRight;

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
                            text: this.oafSchema?.properties?.[this.currentChartTheme.chartParams.yAxisLeft]?.title ?? "",
                            font: {
                                size: 14,
                                family: "MasterPortalFont, Arial, sans-serif"
                            }
                        },
                        min: this.minScaleLeft,
                        max: this.maxScaleLeft,
                        ticks: {
                            precision: 2,
                            stepSize: this.stepSizeLeft,
                            callback: function (value) {
                                const decimal = deltaLeft < 10 ? 2 : 1;

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
                            text: this.oafSchema?.properties?.[this.currentChartTheme.chartParams.yAxisRight]?.title ?? "",
                            font: {
                                size: 14,
                                family: "MasterPortalFont, Arial, sans-serif"
                            }
                        },
                        min: this.minScaleRight,
                        max: this.maxScaleRight,
                        grid: {
                            drawOnChartArea: false
                        },
                        ticks: {
                            precision: 2,
                            stepSize: this.stepSizeRight,
                            callback: function (value) {
                                const decimal = deltaRight < 10 ? 2 : 1;

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
            return this.findStepSizeFromDelta(this.maxDataValueLeft, this.minDataValueLeft);
        },
        /**
         * Minimal scale boundary for the left axis (rounded down with padding).
         * If percentile data is available, uses the lowest P10 value found in
         * this.percentile.perzentile and decreases it by 10%.
         * Falls back to the data-derived min value (rounded) when percentile data is missing
         * or minDataValueLeft is below the value calculated from percentiles
         * @returns {number} minimal scale boundary
         */
        minScaleLeft () {
            if (this.leftScaleRangeFromPercentiles.min && this.leftScaleRangeFromPercentiles.min < this.minDataValueLeft) {
                return this.leftScaleRangeFromPercentiles.min;
            }

            const padding = this.stepSizeLeft > 0.05 ? this.stepSizeLeft : 0;

            return Math.floor(this.minDataValueLeft * 10) / 10 - padding;
        },
        /**
         * Maximal scale boundary for the left axis.
         * If percentile data is available, uses the highest P90 value found in
         * this.percentile.perzentile and increases it by 10%.
         * Falls back to the data-derived max value (rounded) when percentile data is missing
         * or maxDataValueLeft is above the value calculated from percentiles.
         *
         * @returns {number} maximal scale boundary
         */
        maxScaleLeft () {
            if (this.leftScaleRangeFromPercentiles.max && this.leftScaleRangeFromPercentiles.max > this.maxDataValueLeft) {
                return this.leftScaleRangeFromPercentiles.max;
            }

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
            return this.findStepSizeFromDelta(this.maxScaleRight, this.minScaleRight);
        },
        /**
         * Computes a left scale range (min/max) from percentile entries (P10 / P90).
         * Returns {min: number|null, max: number|null}.
         * @returns {{min: number|null, max: number|null}} minimal and maximal value for the left scale
         */
        leftScaleRangeFromPercentiles () {
            const leftScaleRange = {
                min: null,
                max: null
            };

            const pArray = this.percentile?.perzentile;

            if (Array.isArray(pArray) && pArray.length) {
                let maxP90 = Number.NEGATIVE_INFINITY,
                    minP10 = Number.POSITIVE_INFINITY;

                for (let i = 0; i < pArray.length; i++) {
                    const entry = pArray[i],
                          raw10 = entry?.P10,
                          raw90 = entry?.P90,
                          num10 = typeof raw10 === "number" ? raw10 : Number.parseFloat(raw10),
                          num90 = typeof raw90 === "number" ? raw90 : Number.parseFloat(raw90);

                    if (!Number.isNaN(num90) && num90 > maxP90) {
                        maxP90 = num90;
                    }
                    if (!Number.isNaN(num10) && num10 < minP10) {
                        minP10 = num10;
                    }
                }

                if (maxP90 !== Number.NEGATIVE_INFINITY) {
                    leftScaleRange.max = maxP90 + Math.abs(maxP90) * 0.1;
                }

                if (minP10 !== Number.POSITIVE_INFINITY) {
                    leftScaleRange.min = minP10 - Math.abs(minP10) * 0.1;
                }
            }

            return leftScaleRange;
        },

        /**
         * Gets and sets the selected start month.
         * Returns the explicitly set filter start month, or derives it from the dateRange based on the selected filter range.
         * @type {number|null}
         */
        selectedStartMonth: {
            get () {
                if (this.filterStartMonth !== undefined) {
                    return this.filterStartMonth;
                }
                if (this.filterRange === "last-year") {
                    return this.dateRange?.twelveMonthsAgoMonth ?? null;
                }
                if (this.filterRange === "all-time") {
                    return this.dateRange?.allDataStartMonth ?? null;
                }
                return null;
            },
            set (value) {
                this.filterStartMonth = value;
            }
        },
        /**
         * Gets and sets the selected end month.
         * Returns the explicitly set filter end month, or derives it from the dateRange based on the selected filter range.
         * @type {number|null}
         */
        selectedEndMonth: {
            get () {
                if (this.filterEndMonth !== undefined) {
                    return this.filterEndMonth;
                }
                if (this.filterRange === "last-year" || this.filterRange === "all-time") {
                    return this.dateRange?.endMonth ?? null;
                }
                return null;
            },
            set (value) {
                this.filterEndMonth = value;
            }
        },
        /**
         * Gets and sets the selected start year.
         * Returns the explicitly set filter start year, or derives it from the dateRange based on the selected filter range.
         * @type {number|null}
         */
        selectedStartYear: {
            get () {
                if (this.filterStartYear !== undefined) {
                    return this.filterStartYear;
                }
                if (this.filterRange === "last-year") {
                    return this.dateRange?.twelveMonthsAgoYear ?? null;
                }
                if (this.filterRange === "all-time") {
                    return this.dateRange?.allDataStartYear ?? null;
                }
                return null;
            },
            set (value) {
                this.filterStartYear = value;
            }
        },
        /**
         * Gets and sets the selected end year.
         * Returns the explicitly set filter end year, or derives it from the dateRange based on the selected filter range.
         * @type {number|null}
         */
        selectedEndYear: {
            get () {
                if (this.filterEndYear !== undefined) {
                    return this.filterEndYear;
                }
                if (this.filterRange === "last-year" || this.filterRange === "all-time") {
                    return this.dateRange?.endYear ?? null;
                }
                return null;
            },
            set (value) {
                this.filterEndYear = value;
            }
        },
        /**
         * Parse disclaimer.text and split into before / linkText / after parts.
         * Expects a single <link>...</link> placeholder to denote the clickable fragment.
         * @returns {{before: string, linkText: string, after: string}} the parts of the disclaimer info text
         */
        disclaimerParts () {
            if (!this.hasDisclaimer) {
                return {before: "", linkText: "", after: ""};
            }

            const text = this.params.disclaimer.text ?? "",
                  match = text.match(/^(.*?)<link>(.*?)<\/link>(.*)$/s);

            if (match) {
                return {
                    before: match[1],
                    linkText: match[2],
                    after: match[3]
                };
            }

            return {before: text, linkText: "", after: ""};
        }
    },
    watch: {
        allAttributes: {
            deep: true,
            handler (newAttributes, oldAttributes) {
                if (newAttributes === oldAttributes) {
                    return;
                }

                this.filterRange = "last-year";
                this.filterStartMonth = undefined;
                this.filterEndMonth = undefined;
                this.filterStartYear = undefined;
                this.filterEndYear = undefined;

                // run query to get the all data for the current feature (based on the current chart theme and its query attribute)
                this.runQueryOaf({
                    queryPurpose: "getAllData"
                });

                this.getPercentilesForThisData();
            },
            immediate: true
        },
        allData: {
            deep: true,
            handler (newAllData, oldAllData) {
                if (newAllData === oldAllData) {
                    return;
                }

                this.filterFromAllData(this.selectedStartYear, this.selectedStartMonth, this.selectedEndYear, this.selectedEndMonth);
            },
            immediate: true
        },
        percentiles: {
            deep: true,
            handler (newPercentiles, oldPercentiles) {
                if (newPercentiles === oldPercentiles) {
                    return;
                }

                this.getPercentilesForThisData();
            },
            immediate: true
        }
    },
    mounted () {
        if (this.percentiles) {
            return;
        }

        const percentilePath = this.currentChartTheme?.chartParams?.percentiles;

        if (percentilePath) {
            this.queryPercentiles({params: {url: percentilePath}});
        }
    },
    methods: {
        ...mapActions("Modules/WaterStatistics", [
            "queryOaf",
            "queryPercentiles"
        ]),
        ...mapActions("Alerting", [
            "addSingleAlert"
        ]),
        ...mapMutations("Modules/WaterStatistics", [
            "setStatisticValues"
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
         * Determine the tick step size for an axis from the provided max and min values.
         *
         * Thresholds:
         * - delta === 0 -> 10 (fallback when range is zero)
         * - delta < 0.5  -> 0.01
         * - delta < 1    -> 0.1
         * - delta < 2    -> 0.2
         * - otherwise    -> 0.5
         *
         * @param {number} max - Maximum value on the axis.
         * @param {number} min - Minimum value on the axis.
         * @returns {number} Recommended step size for axis ticks.
         */
        findStepSizeFromDelta (max, min) {
            const delta = max - min;

            if (delta === 0) {
                return 10;
            }
            else if (delta < 0.5) {
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
        /**
         * Downloads CSV data by running an OAF query with the current date range and CSV parameters.
         */
        csvDownload () {
            const csvProperties = this.getCsvParams();

            if (this.filterRange === "last-year") {
                const startYear = this.dateRange.twelveMonthsAgoYear,
                      startMonth = this.dateRange.twelveMonthsAgoMonth,
                      endYear = this.dateRange.endYear,
                      endMonth = this.dateRange.endMonth;

                this.rangeStartDate = new Date(Date.UTC(startYear, startMonth - 1, 1));
                this.rangeEndDate = new Date(Date.UTC(endYear, endMonth, 0));
            }

            this.runQueryOaf({
                queryProperties: csvProperties,
                startDate: this.rangeStartDate,
                endDate: this.rangeEndDate,
                queryPurpose: "downloadCsv",
                epsg: this.projectionCode
            });
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
        },
        /**
         * Find and set the percentile entry that corresponds to the current feature's query attribute.
         *
         * Compares the configured query attribute value (from the active chart theme)
         * against entries in this.percentiles (array). Numeric values are normalized
         * to strings for a consistent comparison with attribute values that may be
         * strings or numbers. If a matching entry is found it is assigned to
         * this.percentile, otherwise this.percentile is set to null.
         *
         * @returns {void}
         */
        getPercentilesForThisData () {
            const queryAttribute = this.currentChartTheme.queryParams?.literalFilters?.queryAttribute;

            this.percentile = this.percentiles?.find(data => {
                const compareValue = typeof data[queryAttribute] === "number"
                          ? data[queryAttribute].toString()
                          : data[queryAttribute],
                      givenValue = typeof this.allAttributes?.[queryAttribute] === "number"
                          ? this.allAttributes?.[queryAttribute].toString()
                          : this.allAttributes?.[queryAttribute];

                return compareValue === givenValue;
            });
        },
        /**
         * Sets date range to last year and runs OAF query.
         */
        setDateLastYear () {
            this.filterRange = "last-year";
            this.filterStartMonth = undefined;
            this.filterEndMonth = undefined;
            this.filterStartYear = undefined;
            this.filterEndYear = undefined;

            this.rangeStartDate = undefined;
            this.rangeEndDate = new Date(Date.now());
            this.filterFromAllData(this.dateRange.twelveMonthsAgoYear, this.dateRange.twelveMonthsAgoMonth, this.dateRange.endYear, this.dateRange.endMonth);
        },
        /**
         * Sets date range to all time and runs OAF query.
         */
        setDateAllTime () {
            this.filterRange = "all-time";
            this.filterStartMonth = undefined;
            this.filterEndMonth = undefined;
            this.filterStartYear = undefined;
            this.filterEndYear = undefined;

            const endDate = new Date(),
                  startDate = new Date(this.dateRange.allDataStartYear, this.dateRange.allDataStartMonth - 1, 1);

            this.rangeStartDate = startDate;
            this.rangeEndDate = endDate;

            this.filterFromAllData(this.dateRange.allDataStartYear, this.dateRange.allDataStartMonth, this.dateRange.endYear, this.dateRange.endMonth);
        },
        /**
         * Runs an OAF query with the specified parameters.
         * @param {Object} options - Query options
         * @param {string[]} [options.queryProperties] - Properties to query
         * @param {Date} [options.startDate] - Start date for query range
         * @param {Date} [options.endDate] - End date for query range
         * @param {string} [options.queryPurpose] - Purpose of the query
         * @param {string} [options.epsg] - EPSG code for projection
         */
        runQueryOaf ({queryProperties, startDate, endDate, queryPurpose, epsg} = {}) {
            const oafParams = this.params?.oafParams,
                  chartParams = this.currentChartTheme,
                  queryAttribute = chartParams?.queryParams?.literalFilters?.queryAttribute;

            const queryParams = {
                url: oafParams?.url,
                collections: oafParams?.collection,
                queryField: queryAttribute,
                queryProperties: queryProperties || chartParams?.queryParams?.properties,
                literalFilters: {
                    sortby: chartParams?.queryParams?.literalFilters?.sortBy
                },
                queryValue: this.allAttributes[queryAttribute],
                queryCrs: oafParams?.filterCRS,
                dateField: chartParams?.chartParams?.xAxis,
                startDate,
                endDate
            };

            this.queryOaf({params: queryParams, queryPurpose, epsg});
        },
        /**
         * Sets a manual filter range for the specified date period and runs the OAF query.
         * @param {number} startYear - The start year
         * @param {number} startMonth - The start month (1-12)
         * @param {number} endYear - The end year
         * @param {number} endMonth - The end month (1-12)
         */
        filterByManualRange (startYear, startMonth, endYear, endMonth) {
            if (startYear > endYear || (startYear === endYear && startMonth > endMonth)) {
                this.addSingleAlert({
                    class: "Info",
                    displayClass: "info",
                    content: "Der Endzeitraum muss nach dem Startzeitraum liegen."
                });
                return;
            }

            this.filterRange = "manual";
            this.filterStartYear = startYear;
            this.filterStartMonth = startMonth;
            this.filterEndYear = endYear;
            this.filterEndMonth = endMonth;

            const startDate = new Date(startYear, startMonth - 1, 1),
                  endDate = new Date(endYear, endMonth, 0);

            this.rangeStartDate = startDate;
            this.rangeEndDate = endDate;

            this.filterFromAllData(startYear, startMonth, endYear, endMonth);
        },
        /**
         * Filters the locally available data by a manual date range and updates statistic values.
         * @param {number} startYear - The start year.
         * @param {number} startMonth - The start month (1-12).
         * @param {number} endYear - The end year.
         * @param {number} endMonth - The end month (1-12).
         * @returns {void}
         */
        filterFromAllData (startYear, startMonth, endYear, endMonth) {
            const startDate = new Date(Date.UTC(startYear, startMonth - 1, 1)),
                  endDate = new Date(Date.UTC(endYear, endMonth, 0));
            const queryData = this.allData.filter((item) => {
                const itemDate = new Date(item.properties[this.currentChartTheme.chartParams.xAxis]);

                return itemDate >= startDate && itemDate <= endDate;
            });

            this.setStatisticValues(queryData);
        }
    }
};
</script>

<template>
    <div
        id="TabGraphics"
        class="row chart line"
    >
        <div class="filter">
            <div class="manual-date-range">
                <div class="date-selects">
                    <div class="d-flex align-items-center filter-from-select">
                        <label for="start-month-select">
                            Von:
                        </label>

                        <select
                            v-model="selectedStartMonth"
                            class="start-month-select"
                        >
                            <option
                                v-for="month in dateRange.allMonths"
                                :key="month.value"
                                :value="month.value"
                            >
                                {{ month.label }}
                            </option>
                        </select>

                        <select
                            v-model="selectedStartYear"
                            class="start-year-select"
                        >
                            <option
                                v-for="year in dateRange.allYears"
                                :key="year"
                                :value="year"
                            >
                                {{ year }}
                            </option>
                        </select>
                    </div>

                    <div
                        class="filter-to-select"
                    >
                        <label for="end-month-select">
                            Bis:
                        </label>

                        <select
                            v-model="selectedEndMonth"
                            class="end-month-select"
                        >
                            <option
                                v-for="month in dateRange.allMonths"
                                :key="month.value"
                                :value="month.value"
                            >
                                {{ month.label }}
                            </option>
                        </select>
                        <select
                            v-model="selectedEndYear"
                            class="end-year-select"
                        >
                            <option
                                v-for="year in dateRange.allYears"
                                :key="year"
                                :value="year"
                            >
                                {{ year }}
                            </option>
                        </select>
                    </div>
                </div>

                <FlatButton
                    id="apply-date-range"
                    aria="Anwenden"
                    title="Anwenden"
                    text="Anwenden"
                    @click="filterByManualRange(selectedStartYear, selectedStartMonth, selectedEndYear, selectedEndMonth)"
                />
            </div>

            <div
                id="filter-btn-group"
                class="btn-group btn-group-sm"
                role="group"
            >
                <button
                    id="last-year"
                    :class="{ active: filterRange === 'last-year' }"
                    class="btn btn-secondary"
                    aria="Letzte 12 Monate"
                    title="Letzte 12 Monate"
                    text="Letzte 12 Monate"
                    @click="setDateLastYear"
                >
                    Letzte 12 Monate
                </button>

                <button
                    id="all-time"
                    :class="{ active: filterRange === 'all-time' }"
                    class="btn btn-secondary"
                    aria="Gesamte Zeitreihe"
                    title="Gesamte Zeitreihe"
                    text="Gesamte Zeitreihe"
                    @click="setDateAllTime"
                >
                    Gesamte Zeitreihe
                </button>
            </div>
        </div>

        <LinechartItem
            :data="chartData"
            :given-options="lineChartOptions"
        />

        <div
            v-if="hasDisclaimer"
            class="dataDisclaimerContainer"
        >
            <p>
                <span v-if="disclaimerParts.before">
                    {{ disclaimerParts.before }}
                </span>

                <button
                    v-if="disclaimerParts.linkText"
                    class="disclaimer-link btn btn-link p-0"
                    type="button"
                    @click="showDisclaimerModal = !showDisclaimerModal"
                >
                    {{ disclaimerParts.linkText }}
                </button>

                <span v-if="disclaimerParts.after">
                    {{ disclaimerParts.after }}
                </span>
            </p>

            <TabGraphicsDisclaimerModal
                :params="params"
                :show="showDisclaimerModal"
                @close="showDisclaimerModal = false"
            />
        </div>

        <div class="downloadArea">
            <FlatButton
                aria="Alle Daten des aktuell dargestellten Zeitbereichs im CSV-Format herunterladen"
                icon="bi-cloud-arrow-down-fill"
                title="Alle Daten des aktuell dargestellten Zeitbereichs im CSV-Format herunterladen"
                :interaction="() => csvDownload()"
                text="Download CSV"
            />
        </div>

        <div
            v-if="dataLoading"
            class="spinner-wrapper"
        >
            <SpinnerItem custom-class="spinner" />
        </div>
    </div>
</template>

<style lang="scss" scoped>
#TabGraphics {
    position: relative; // ensure the spinner-wrapper is positioned correctly within this container
    div.filter {
        margin-bottom: 10px;

        button {
            border: 1px solid #adadad;
            &.active {
                color: $white;
            }
            &:hover {
                color: $white;
            }
        }

        .btn-group {
            padding: 8px;
        }

        div.manual-date-range {
            display: flex;
            flex-direction: row;
            flex-wrap: wrap;
            align-items: center;
            gap: 10px;
            border: 1px dashed lightgray;
            margin-top: 10px;
            padding: 10px;

            .date-selects {
                display: flex;
                flex-direction: column;
                gap: 10px;
            }

            select {
                padding: 4px 2px;
                border-radius: 4px;
                border: 1px solid #adadad;
            }

            .filter-from-select,
            .filter-to-select {
                display: flex;
                align-items: center;
                gap: 5px;
            }

            label {
                min-width: 2.5rem; // same width for "Von:" and "Bis:" so the selects start at the same x-position
            }

            #apply-date-range {
                align-self: center;
                margin-bottom: 0;
            }
        }
    }

    .diagram {
        height: 400px;
        width: 100%;
        background-color: #f5f5f5;
        border: 1px solid #ccc;
        margin-bottom: 20px;
    }

    div.dataDisclaimerContainer {
        display: flex;
        justify-content: center;
        margin-top: 1rem;

        p, p > button.btn {
            font-size: 1rem;
        }
    }

    div.downloadArea {
        margin-top: 1rem;
    }

    div.spinner-wrapper {
        position: absolute;
        inset: 0; // top/right/bottom/left: 0
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        background-color: rgba(255, 255, 255, 0.7); // optional dimming layer
        z-index: 10;
        margin-top: 0;
    }
}
</style>
