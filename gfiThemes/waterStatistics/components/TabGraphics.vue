<script>
import {mapGetters, mapActions, mapMutations} from "vuex";
import LinechartItem from "@shared/modules/charts/components/LinechartItem.vue";
import FlatButton from "@shared/modules/buttons/components/FlatButton.vue";
import SpinnerItem from "@shared/modules/spinner/components/SpinnerItem.vue";
import thousandsSeparator from "@shared/js/utils/thousandsSeparator.js";
import TabGraphicsDisclaimerModal from "./TabGraphicsDisclaimerModal.vue";
import TableComponent from "@shared/modules/table/components/TableComponent.vue";
import SwitchInput from "@shared/modules/checkboxes/components/SwitchInput.vue";

export default {
    name: "TabGraphics",
    components: {
        FlatButton,
        SpinnerItem,
        LinechartItem,
        TabGraphicsDisclaimerModal,
        TableComponent,
        SwitchInput
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
            percentileChartBasis: {},
            filterRange: "last-year",
            rangeStartDate: undefined,
            rangeEndDate: undefined,
            filterStartMonth: undefined,
            filterEndMonth: undefined,
            filterStartYear: undefined,
            filterEndYear: undefined,
            showDisclaimerModal: false,
            offscreenKey: 0,
            showTable: false
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
        ...mapGetters(["isMobile"]),
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
        /**
         * Determines whether the statistic data contain any data points.
         *
         * Returns true when statisticValues has at least one dataset with a parameter
         * that shall be displayed on the left or right axis.
         *
         * @returns {boolean} True if chart contains data points, otherwise false.
         */
        hasData () {
            const leftAxisParameter = this.currentChartTheme.chartParams?.yAxisLeft,
                  rightAxisParameter = this.currentChartTheme.chartParams?.yAxisRight;

            if (this.statisticValues &&
                this.statisticValues.length > 0 &&
                this.statisticValues.some((val) => {
                    return (
                        Object.hasOwn(val.properties, leftAxisParameter) &&
                        val.properties[leftAxisParameter] !== undefined
                    ) ||
                        (
                            rightAxisParameter &&
                            Object.hasOwn(val.properties, rightAxisParameter) &&
                            val.properties[rightAxisParameter] !== undefined
                        );
                })
            ) {
                return true;
            }

            return false;
        },
        /**
         * Builds the title for the line chart by combining the schema title of the
         * configured query attribute with the corresponding attribute value of the current feature.
         *
         * Example result: "Messstellennummer 2050"
         *
         * @returns {string} Concatenated chart title.
         */
        getLineChartTitle () {
            const prefix = this.oafSchema?.properties?.[this.currentChartTheme.queryParams?.literalFilters?.queryAttribute]?.title,
                  value = this.allAttributes?.[this.currentChartTheme.queryParams?.literalFilters?.queryAttribute];

            return prefix + " " + value;
        },
        /**
         * Returns the display title for the left Y axis derived from the OAF schema.
         * Falls back to an empty string when no title is configured.
         *
         * @returns {string} Left axis title or empty string.
         */
        leftAxisTitle () {
            return this.oafSchema?.properties?.[this.currentChartTheme.chartParams?.yAxisLeft]?.title ?? "";
        },
        /**
         * Returns the display title for the right Y axis derived from the OAF schema.
         * Falls back to an empty string when no title is configured.
         *
         * @returns {string} Right axis title or empty string.
         */
        rightAxisTitle () {
            return this.oafSchema?.properties?.[this.currentChartTheme.chartParams?.yAxisRight]?.title ?? "";
        },
        /**
         * Chart.js options for the line chart, including scales and axis titles.
         *  overwrites default options set in the LinechartItem component
         * @returns {Object} options to use for the line chart
         */
        lineChartOptions () {
            const deltaLeft = this.maxScaleLeft - this.minScaleLeft,
                  deltaRight = this.maxScaleRight - this.minScaleRight,
                  hasPercentile = Boolean(this.percentile),
                  percentileLineTitles = hasPercentile ? Object.values(this.percentileChartBasis).map(value => value.title) : [];

            return {
                plugins: {
                    title: {
                        display: true,
                        text: this.getLineChartTitle,
                        font: {
                            size: 20,
                            family: "'MasterPortalFont Bold', 'Arial Narrow', Arial, sans-serif"
                        }
                    },
                    legend: {
                        display: hasPercentile,
                        position: "bottom",
                        labels: {
                            filter: function (legendItem) {
                                return percentileLineTitles.includes(legendItem.text);
                            }
                        },
                        /**
                         * Show a small tooltip at the mouse position when hovering legend items.
                         * @param {MouseEvent} evt
                         * @param {Object} item not used in this function
                         * @param {Object} legend
                         */
                        onHover: (evt, _, legend) => {
                            if (!evt) {
                                return;
                            }
                            this.showLegendTooltip(evt, legend && legend.chart ? legend.chart : null);
                        },
                        /**
                         * Remove tooltip when leaving legend.
                         */
                        onLeave: () => {
                            this.hideLegendTooltip();
                        },
                        /**
                         * Sync legend item visibility settings between the visible chart and the offscreen export chart.
                         * @param {MouseEvent} evt not used in this function
                         * @param {Object} legendItem
                         * @param {Object} legend
                         */
                        onClick: (_, legendItem, legend) => {
                            this.updateOffscreenChart(legendItem, legend);
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
                            text: this.leftAxisTitle,
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
                        reverse: this.hasRightAxis ? this.currentChartTheme.chartParams?.rightAxisTransform?.reverse : false,
                        display: this.hasRightAxis,
                        position: "right",
                        title: {
                            display: true,
                            text: this.rightAxisTitle,
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
                label: this.leftAxisTitle,
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
                    label: this.rightAxisTitle,
                    data: right_data,
                    hoverOffset: 4,
                    backgroundColor: "#3C5F94",
                    borderColor: "#3C5F94",
                    borderWidth: 0,
                    pointStyle: false,
                    yAxisID: "yRight"
                });
            }

            // add percentile lines when configured
            if (this.percentile && this.percentile.perzentile && this.percentileChartBasis && Object.keys(this.percentileChartBasis).length) {
                // map percentile entries by month key "01".."12"
                const pEntries = Array.isArray(this.percentile.perzentile) ? this.percentile.perzentile : [],
                      byMonth = new Map();

                pEntries.forEach(entry => {
                    const key = String(entry?.PRZ_REFERENZMONAT ?? "").padStart(2, "0");

                    if (key) {
                        byMonth.set(key, entry);
                    }
                });

                Object.keys(this.percentileChartBasis).forEach(key => {
                    const meta = this.percentileChartBasis[key],
                          data = labels.map(lbl => {
                              const mKey = this.monthKeyFromLabel(lbl),
                                    entry = mKey ? byMonth.get(mKey) : null,
                                    val = entry && Object.prototype.hasOwnProperty.call(entry, key) ? entry[key] : null;

                              if (typeof val === "number") {
                                  return val;
                              }
                              if (val === null) {
                                  return null;
                              }
                              const parsed = Number.parseFloat(val);

                              return Number.isNaN(parsed) ? null : parsed;
                          });

                    datasets.push({
                        label: meta?.title ?? key,
                        data: data,
                        borderColor: meta?.color ? `#${meta.color}` : "#000000",
                        borderWidth: 1.5,
                        borderDash: [5, 3],
                        pointRadius: 0,
                        tension: 0.15,
                        fill: false,
                        yAxisID: "y",
                        hidden: true
                    });
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
        },
        /**
         * Options for the hidden export chart: same as the visible chart, but fixed size and no animation.
         * @returns {Object} chart options for the offscreen export chart
         */
        offscreenChartOptions () {
            return {
                ...this.lineChartOptions,
                plugins: {
                    ...this.lineChartOptions.plugins,
                    title: {
                        ...this.lineChartOptions.plugins.title,
                        display: false
                    }
                },
                responsive: false,
                maintainAspectRatio: false,
                animation: false
            };
        },
        /**
         * Fixed pixel height for the offscreen export chart, derived from the visible chart's aspect ratio.
         * @returns {number} height in px for the 800px-wide export chart
         */
        offscreenChartHeight () {
            const canvas = this.$refs.lineChart?.$el,
                  aspectRatio = canvas?.clientHeight && canvas?.clientWidth
                      ? canvas.clientHeight / canvas.clientWidth
                      : 0.5;

            return Math.round(800 * aspectRatio);
        },
        /**
         * Assembles table data (headers and items) from statisticValues, using
         * currentChartTheme.tableParams (array of property keys) to define the columns.
         * @returns {{headers: Array, items: Array}} table data for TableComponent
         */
        tableData () {
            const tableParams = this.currentChartTheme?.tableParams || [],
                  headers = tableParams.map((key, index) => ({
                      name: key,
                      displayName: this.oafSchema?.properties?.[key]?.title ?? key,
                      index
                  })),
                  items = (this.statisticValues || []).map((dataset) => {
                      const item = {};

                      tableParams.forEach((key) => {
                          item[key] = this.checkValueAndFormatDate(dataset?.properties?.[key]);
                      });

                      return item;
                  });

            return {
                headers,
                items
            };
        }
    },
    watch: {
        allAttributes: {
            deep: true,
            handler (newAttributes, oldAttributes) {
                const queryAttribute = this.currentChartTheme.queryParams?.literalFilters?.queryAttribute;

                if (newAttributes?.[queryAttribute] === oldAttributes?.[queryAttribute]) {
                    return;
                }

                if (!this.isMobile) {
                    this.increaseSidebarWidth();
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
            "queryPercentiles",
            "addChartToPdf",
            "increaseSidebarWidth"
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

            if (this.percentile) {
                this.generatePercentileChartBasis();
            }
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
        },
        /**
         * Captures the hidden, fixed-width export chart as a PNG data URL.
         * @returns {Promise<{imgData: string, width: number, height: number}|null>} chart image data, or null if unavailable
         */
        async captureChartImage () {
            const canvas = this.$refs.offscreenLineChart?.$el;

            if (!canvas) {
                return null;
            }

            // let Vue apply the latest data/options to the hidden chart, then let
            // Chart.js actually paint before reading pixels
            await this.$nextTick();
            await new Promise(resolve => requestAnimationFrame(resolve));

            return {
                imgData: canvas.toDataURL("image/png"),
                width: canvas.width,
                height: canvas.height
            };
        },
        /**
         * Triggers PDF generation for the current chart via the store action.
         * @returns {void}
         */
        async downloadChartAsPdf () {
            const chartImage = await this.captureChartImage(),
                  pdfParams = this.currentChartTheme?.pdfParams;

            if (!chartImage) {
                return;
            }

            let attributeString = "",
                titleArray = [];

            if (pdfParams) {
                titleArray = Object.keys(pdfParams?.titleAttributes).map(param => {
                    if (pdfParams?.titleAttributes?.[param]?.label) {
                        attributeString = pdfParams?.titleAttributes?.[param]?.label + ": " + this.allAttributes?.[param];
                    }
                    else {
                        attributeString = this.allAttributes?.[param];
                    }

                    if (pdfParams?.titleAttributes?.[param]?.unit) {
                        attributeString += " " + pdfParams?.titleAttributes?.[param]?.unit;
                    }
                    return attributeString;
                });
            }

            this.addChartToPdf({
                ...chartImage,
                titleArray: titleArray,
                useHamburgDesign: pdfParams?.useHamburgDesign,
                logoPath: pdfParams?.base64LogoPath
            });
        },
        /*
         * Generates a mapping of percentile keys to display metadata used by the chart.
         *
         * Reads the first percentile entry (this.percentile.perzentile[0]) to discover which
         * percentile keys exist (ignores keys containing an underscore). For each detected key
         * a basis entry is created on this.percentileChartBasis with the shape:
         *   { [key]: { title: string|null, color: string|null } }
         *
         * The function mutates this.percentileChartBasis in-place and returns nothing.
         *
         * @returns {void}
         */
        generatePercentileChartBasis () {
            if (this.percentile && this.percentile.perzentile && this.percentile.perzentile.length > 0) {
                // this.percentileChartBasis is an object, holding title and color for the lines in the chart
                // {
                // "MIN": {
                //     "title": "unterhalb Minimum",
                //     "color": "A900E6"
                // },
                // "P10": {
                //     "title": "sehr niedrig",
                //     "color": "FF0000"
                // },
                // "P25": {
                //     "title": "niedrig",
                //     "color": "FFFF00"
                // }
                const datasets = Object.keys(this.percentile.perzentile[0])?.filter(key => {
                    return key.indexOf("_") === -1;
                });

                this.percentileChartBasis = {};

                datasets.forEach(datasetKey => {
                    this.percentileChartBasis[datasetKey] = {
                        title: this.percentile.perzentile[0][`${datasetKey}_DESCR`],
                        color: this.percentile.perzentile[0][`${datasetKey}_HEX`]
                    };
                });

            }
        },
        /**
         * Try to derive month key ("01".."12") from a label.
         * Falls back to null when unknown.
         * @param {string} label
         * @returns {string|null} month key or null
         */
        monthKeyFromLabel (label) {
            if (!label) {
                return null;
            }
            const str = String(label).trim();

            // try YYYY-MM or YYYY-MM-DD
            const iso = str.match(/^(\d{4})-(\d{2})(-\d{2})?/);

            if (iso) {
                return iso[2];
            }

            // try MM/YYYY or MM.YYYY or DD/MM/YYYY or DD.MM.YYYY
            const euro = str.match(/(^|\D)(\d{1,2})([/.]\d{4})/);

            if (euro) {
                return String(Number(euro[2])).padStart(2, "0");
            }

            // try Date parse
            const d = new Date(str);

            if (!Number.isNaN(d.getTime())) {
                return String(d.getMonth() + 1).padStart(2, "0");
            }
            return null;
        },
        /**
         * Show a small tooltip near the mouse cursor explaining the legend action.
         * Creates a single DOM node with id 'tabgraphics-percentile-tooltip'.
         * Accepts optional chart param to translate canvas-relative coordinates.
         * @param {MouseEvent} evt
         * @param {Object|null} chart
         */
        showLegendTooltip (evt, chart = null) {
            try {
                const id = "tabgraphics-percentile-tooltip";
                let tip = document.getElementById(id);

                if (!tip) {
                    tip = document.createElement("div");
                    tip.id = id;
                    tip.style.position = "fixed";
                    tip.style.pointerEvents = "none";
                    tip.style.background = "rgba(0,0,0,0.75)";
                    tip.style.color = "#ffffff";
                    tip.style.padding = "0.25rem 0.5rem";
                    tip.style.borderRadius = "0.25rem";
                    tip.style.fontSize = "0.875rem";
                    tip.style.zIndex = "4000";
                    tip.style.transition = "transform 0.08s ease, opacity 0.08s ease";
                    tip.style.opacity = "0";
                    tip.textContent = "Perzentilen ein-/ausblenden";
                    document.body.appendChild(tip);
                }

                const offsetX = 12,
                      offsetY = 12;

                // Determine viewport coordinates:
                // If chart and canvas are provided and event coordinates are canvas-local,
                // translate by canvas bounding rect. Otherwise fall back to clientX/clientY.
                let left = 0,
                    top = 0;

                const canvasRect = chart && chart.canvas && typeof chart.canvas.getBoundingClientRect === "function"
                    ? chart.canvas.getBoundingClientRect()
                    : null;

                if (canvasRect && typeof evt.x === "number" && typeof evt.y === "number") {
                    left = canvasRect.left + evt.x + offsetX;
                    top = canvasRect.top + evt.y + offsetY;
                }
                else if (typeof evt.clientX === "number" && typeof evt.clientY === "number") {
                    left = evt.clientX + offsetX;
                    top = evt.clientY + offsetY;
                }
                else {
                    // best-effort fallback using pageX/pageY
                    left = (evt.pageX || 0) + offsetX;
                    top = (evt.pageY || 0) + offsetY;
                }

                // keep tooltip within viewport
                const rect = tip.getBoundingClientRect();
                const vw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
                const vh = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0);

                if (left + rect.width + 8 > vw) {
                    left = vw - rect.width - 8;
                }
                if (top + rect.height + 8 > vh) {
                    top = vh - rect.height - 8;
                }

                tip.style.left = `${left}px`;
                tip.style.top = `${top}px`;
                // small visible animation
                requestAnimationFrame(() => {
                    tip.style.opacity = "1";
                    tip.style.transform = "translateY(0)";
                });
            }
            catch (e) {
                console.error(e);
            }
        },

        /**
         * Hides and removes the legend tooltip if present.
         */
        hideLegendTooltip () {
            try {
                const id = "tabgraphics-percentile-tooltip",
                      tip = document.getElementById(id);

                if (!tip) {
                    return;
                }

                tip.style.opacity = "0";
                // remove after transition
                setTimeout(() => {
                    if (tip && tip.parentNode) {
                        tip.parentNode.removeChild(tip);
                    }
                }, 120);
            }
            catch (e) {
                console.error(e);
            }
        },
        /**
         * Synchronize visibility between the visible chart and the hidden export chart
         * when a legend item is clicked.
         *
         * This method toggles the clicked dataset's visibility on the visible Chart.js
         * instance (using the chart meta), mirrors the resulting hidden flag into the
         * reactive chartData.datasets[].hidden so the offscreen chart receives the change,
         * and schedules a remount/update of the offscreen LinechartItem by incrementing
         * offscreenKey on the next tick.
         *
         * Note: the function intentionally avoids mutating computed properties directly
         * outside of mirroring the hidden flag and uses $nextTick to prevent synchronous
         * reactive cycles with Chart.js internal mutations.
         *
         * @param {Object} legendItem - Chart.js legend item object (contains datasetIndex).
         * @param {Object} legend - Chart.js legend context (contains chart reference).
         * @returns {void}
         */
        updateOffscreenChart (legendItem, legend) {
            try {
                const ci = legend.chart,
                      idx = legendItem.datasetIndex,
                      meta = ci.getDatasetMeta(idx);

                meta.hidden = meta.hidden === null ? !ci.data.datasets[idx].hidden : !meta.hidden;
                ci.update();

                if (this.chartData && this.chartData.datasets && this.chartData.datasets[idx]) {
                    this.chartData.datasets[idx].hidden = meta.hidden;
                }

                this.$nextTick(() => {
                    this.offscreenKey++;
                });
            }
            catch (e) {
                console.error(e);
            }
        },
        /**
         * Formats a value as "DD/MM/YYYY" if it represents a valid date (Date instance
         * or ISO-like date string). Returns the original value unchanged if there is a value, if not returns "-".
         * @param {*} value - value to check/format
         * @returns {*} formatted date string or the original value
         */
        checkValueAndFormatDate (value) {
            if (value === null || value === undefined) {
                return "-";
            }
            if (!(value instanceof Date) && typeof value !== "string") {
                if (typeof value === "number") {
                    return Math.round(value * 100) / 100;
                }
                return value;
            }
            if (typeof value === "string" && !(/^\d{4}-\d{2}-\d{2}/).test(value)) {
                return value;
            }

            const date = value instanceof Date ? value : new Date(value);

            if (Number.isNaN(date.getTime())) {
                return value;
            }

            const day = String(date.getDate()).padStart(2, "0"),
                  month = String(date.getMonth() + 1).padStart(2, "0"),
                  year = date.getFullYear();

            return `${day}/${month}/${year}`;
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

        <SwitchInput
            id="show-table-switch"
            :label="showTable ? 'Ganglinie anzeigen' : 'Tabelle anzeigen'"
            :aria="showTable ? 'Ganglinie anzeigen' : 'Tabelle anzeigen'"
            :checked="showTable"
            :interaction="() => { showTable = !showTable; }"
        />

        <p
            v-if="!hasData"
            class="noDataInfo"
        >
            Für den ausgewählten Zeitraum liegen keine Daten vor.
        </p>

        <LinechartItem
            v-if="!showTable"
            ref="lineChart"
            :data="chartData"
            :given-options="lineChartOptions"
        />

        <TableComponent
            v-else
            :data="tableData"
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

            <FlatButton
                v-if="!showTable"
                aria="Grafik als PDF herunterladen"
                icon="bi-file-earmark-pdf-fill"
                title="Grafik als PDF herunterladen"
                :interaction="() => downloadChartAsPdf()"
                text="Download PDF"
            />

            <div
                class="offscreen-chart"
                aria-hidden="true"
            >
                <LinechartItem
                    ref="offscreenLineChart"
                    :key="offscreenKey"
                    :data="chartData"
                    :given-options="offscreenChartOptions"
                    :width="800"
                    :height="offscreenChartHeight"
                />
            </div>
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

    p.noDataInfo {
        text-align: center;
        color: $light_red;
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
        display: flex;
        flex-wrap: wrap;
        gap: 5px;
        align-items: center;

        div.offscreen-chart {
            position: absolute;
            left: -9999px;
            top: -9999px;
            pointer-events: none;
        }
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

    :deep(.form-switch) {
        display: flex;
        align-items: center;
        flex-direction: row-reverse; // shows label first (left), switch second (right)
        margin-left: auto;
        margin-bottom: 0.25rem;

        .form-check-input {
            margin-left: 0; // remove bootstrap's default negative pull-back, not needed in flex layout
        }

        .form-check-label {
            margin: 0;
        }
    }
    :deep(.fixed) {
        max-height: 450px;
        overflow-y: auto;
    }

    :deep(table) {
       width: auto;

        th.fixedWidth {
            min-width: 100px;
            height: 1rem;
            text-align: center;
            background-color: $secondary;
            color: $white;
            vertical-align: middle;

            .th-style {
                display: -webkit-box;
                -webkit-line-clamp: 2;
                line-clamp: inherit;
                -webkit-box-orient: vertical;
                font-size: clamp(0.8rem, 1.2vw, 0.875rem);
                white-space: normal;
                line-height: 1rem;
                margin: 0.5rem !important;
                overflow: hidden;
                hyphens: auto;
                overflow-wrap: break-word;
            }
        }

        td {
            text-align: center;
        }

       tbody tr:nth-of-type(even):not(.fixed-row):not(.fixed) > td {
            background-color: rgba(0, 0, 0, 0.05);
        }
    }
}
</style>
