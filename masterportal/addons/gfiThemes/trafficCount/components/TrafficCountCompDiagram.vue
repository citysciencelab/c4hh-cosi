<script>
import LinechartItem from "@shared/modules/charts/components/LinechartItem.vue";
import {mapGetters} from "vuex";

export default {
    name: "TrafficCountCompDiagram",
    components: {
        LinechartItem
    },
    props: {
        /**
         * the data from the api (without gaps and in order)
         * the diagram will take the first occuring entry of meansOfTransport (make sure to order apiData first)
         * e.g. [{bikes: {date: bikevalue1}, cars: {date: carvalue1}}, {bikes: {date: bikevalue2}, cars: {date: carvalue2}}]
         * (! first entry is bikes, so only bikes will be shown)
         */
        apiData: {
            type: Array,
            required: true
        },
        /**
         * The current meansOfTransport
         */
        currentMeansOfTransport: {
            type: String,
            required: true
        },

        /**
         * sets the tooltip if the mouse hovers over a point
         * @param {Object} tooltipItem the tooltipItem from chartjs (see https://www.chartjs.org/docs/latest/configuration/tooltip.html?h=tooltipitem)
         * @returns {String}  the String to show
         */
        setTooltipValue: {
            type: Function,
            required: true
        },
        /**
         * the ticks on the x axis (e.g. 12 for the day)
         */
        xAxisTicks: {
            type: Number,
            required: false,
            default: 0
        },
        /**
         * the ticks on the y axis
         */
        yAxisTicks: {
            type: Number,
            require: false,
            default: 0
        },
        /**
         * sets the label of the x axis
         * @param {String} datetime the value of the x axis - the datetime in our case
         * @returns {String}  the label of the x axis
         */
        renderLabelXAxis: {
            type: Function,
            required: true
        },
        /**
         * sets the label of the y axis
         * @param {String} yValue the value of the y axis
         * @returns {String}  the label of the y axis
         */
        renderLabelYAxis: {
            type: Function,
            required: true
        },
        /**
         * sets the description for the x axis
         */
        descriptionXAxis: {
            type: String,
            required: false,
            default: ""
        },
        /**
         * sets the description for the y axis
         */
        descriptionYAxis: {
            type: String,
            required: false,
            default: ""
        },
        /**
         * a function (datetime) to write the text of the legend with
         * @param {String} datetime the full datetime of the first element in a dataset (format "YYYY-MM-DD HH:mm:ss")
         * @returns {String}  the text for the legend
         */
        renderLabelLegend: {
            type: Function,
            required: true
        },
        /**
         * a function (datetime[]) to get the point style
         * @param {String[]} datetime the full datetime of dataset (format ["YYYY-MM-DD HH:mm:ss", ...])
         * @returns {String}  the pointStyle in Array
         */
        renderPointStyle: {
            type: Function,
            required: true
        },
        /**
         * a function (datetime[]) to get the point size
         * @param {String[]} datetime the full datetime of dataset (format ["YYYY-MM-DD HH:mm:ss", ...])
         * @returns {String}  the pointSize in Array
         */
        renderPointSize: {
            type: Function,
            required: true
        },
        /**
         * The keys of meansOfTransport
         */
        meansOfTransportKey: {
            type: Array,
            required: true
        }
    },
    data () {
        return {
            chartData: {},
            colors: ["#36A2EB", "#FF6384", "#4BC0C0", "#FF9F40", "#9966FF", "#FFCD56", "#C9CBCF"],
            fontColorGraph: "black",
            fontColorLegend: "#555555",
            fontSizeGraph: 10,
            fontSizeLegend: 12,
            colorTooltipFont: "#555555",
            colorTooltipBack: "#f0f0f0"
        };
    },
    computed: {
        ...mapGetters("Modules/TrafficCount", [
            "activeTabId"
        ]),
        /**
         * returns the config for chart js
         * @returns {Object}  an object to use as config for chartjs
         */
        chartConfig () {
            return this.getChartJsConfig(this.chartData, {
                titleColor: this.colorTooltipFont,
                backgroundColor: this.colorTooltipBack,
                setTooltipValue: this.setTooltipValue,
                fontSizeGraph: this.fontSizeGraph,
                fontSizeLegend: this.fontSizeLegend,
                fontColorGraph: this.fontColorGraph,
                fontColorLegend: this.fontColorLegend,
                xAxisTicks: this.xAxisTicks,
                yAxisTicks: this.yAxisTicks,
                renderLabelXAxis: this.renderLabelXAxis,
                renderLabelYAxis: this.renderLabelYAxis,
                descriptionXAxis: this.descriptionXAxis,
                descriptionYAxis: this.descriptionYAxis
            });
        }
    },
    watch: {
        apiData: {
            handler (newData) {
                if (Array.isArray(newData) && newData.length) {
                    this.chartData = this.createDataForDiagram(newData, this.colors, this.renderLabelLegend, this.renderPointStyle, this.renderPointSize);
                }
                else {
                    this.chartData = {};
                }
            },
            deep: true
        },
        /**
         * Updates the chart data when means of transport key changes.
         * @returns {Void}  -
         */
        meansOfTransportKey: {
            handler () {
                if (Array.isArray(this.apiData) && this.apiData.length) {
                    this.chartData = this.createDataForDiagram(this.apiData, this.colors, this.renderLabelLegend, this.renderPointStyle, this.renderPointSize);
                }
            },
            deep: true
        }
    },
    mounted () {
        if (Array.isArray(this.apiData) && this.apiData.length) {
            this.chartData = this.createDataForDiagram(this.apiData, this.colors, this.renderLabelLegend, this.renderPointStyle, this.renderPointSize);
        }
    },
    methods: {
        /**
         * creates the datasets for chartjs
         * @param {Object[]} apiData the apiData as received by parent
         * @param {String[]} colors an array of colors to use for coloring the datasets
         * @param {Function} callbackRenderLabelLegend a function(datetime) to render the text of the legend
         * @param {Function} callbackRenderPointStyle a function(datetime[]) to render the point style in Array
         * @param {Function} callbackRenderPointSize a function(datetime[]) to render the point size in Array
         * @returns {Object}  an object {labels, datasets} to use for chartjs
         */
        createDataForDiagram (apiData, colors, callbackRenderLabelLegend, callbackRenderPointStyle, callbackRenderPointSize) {
            if (!Array.isArray(apiData) || apiData.length === 0 || typeof apiData[0] !== "object" || apiData[0] === null || Object.keys(apiData[0]).length === 0) {
                return [];
            }

            const labelsXAxis = [],
                  datasets = [],
                  keysOfFirstDataset = Object.keys(apiData[0][this.meansOfTransportKey[0]]);

            keysOfFirstDataset.forEach(datetime => {
                labelsXAxis.push(datetime);
            });

            apiData.forEach((dataObj, idx) => {
                if (!Object.prototype.hasOwnProperty.call(dataObj, this.meansOfTransportKey[0])) {
                    return;
                }

                this.meansOfTransportKey.forEach((meansOfTransport) => {
                    let postfix = "";

                    if (meansOfTransport === "Anzahl_Schwerverkehr" && this.currentMeansOfTransport === "Anzahl_Kfz") {
                        postfix = " " + this.$t("additional:modules.tools.gfi.themes.trafficCount.heavyTraffic");
                    }
                    else if (meansOfTransport === "Anzahl_Kfz" && this.currentMeansOfTransport === "Anzahl_Schwerverkehr") {
                        postfix = " " + this.$t("additional:modules.tools.gfi.themes.trafficCount.totalTraffic");
                    }
                    const datetimes = typeof dataObj[meansOfTransport] !== "undefined" ? Object.keys(dataObj[meansOfTransport]) : [],
                          isComplementaryDataset = meansOfTransport === "Anzahl_Schwerverkehr" && this.currentMeansOfTransport === "Anzahl_Kfz"
                              || meansOfTransport === "Anzahl_Kfz" && this.currentMeansOfTransport === "Anzahl_Schwerverkehr",
                          color = Array.isArray(colors) ? colors[idx % colors.length] : "",
                          holidayData = {
                              borderColor: color,
                              fill: false,
                              label: this.$t("additional:modules.tools.gfi.themes.trafficCount.holidaySign") + postfix,
                              pointBorderColor: color,
                              pointBackgroundColor: color,
                              pointRadius: 3,
                              pointStyleLegend: "star"
                          },
                          checkIsHoliday = typeof callbackRenderPointStyle === "function",
                          checkSize = typeof callbackRenderPointSize === "function";

                    datasets.push({
                        label: datetimes.length > 0 && typeof callbackRenderLabelLegend === "function" ? callbackRenderLabelLegend(datetimes[0]) + postfix : "",
                        data: typeof dataObj[meansOfTransport] !== "undefined" ? Object.values(dataObj[meansOfTransport]) : [],
                        backgroundColor: color,
                        borderColor: color,
                        spanGaps: true,
                        tension: 0,
                        fill: false,
                        borderWidth: 2,
                        borderDash: isComplementaryDataset ? [2, 2] : [],
                        pointStyle: (context) => {
                            const datetime = datetimes[context?.dataIndex],
                                  isHoliday = datetime && checkIsHoliday && callbackRenderPointStyle(meansOfTransport, [datetime])?.includes?.("star");

                            return isHoliday ? "star" : "circle";
                        },
                        pointRadius: (context) => {
                            const datetime = datetimes[context?.dataIndex],
                                  isHoliday = datetime && checkIsHoliday && callbackRenderPointStyle(meansOfTransport, [datetime])?.includes?.("star");

                            if (!isHoliday) {
                                return 0;
                            }
                            return checkSize ? callbackRenderPointSize([datetime]) : 4;
                        },
                        pointHoverRadius: (context) => {
                            const datetime = datetimes[context?.dataIndex],
                                  isHoliday = datetime && checkIsHoliday && callbackRenderPointStyle(meansOfTransport, [datetime])?.includes?.("star"),
                                  baseSize = checkSize && datetime ? callbackRenderPointSize([datetime]) : 3,
                                  safeBaseSize = typeof baseSize === "number" && !isNaN(baseSize) ? baseSize : 3;

                            return isHoliday ? safeBaseSize + 7 : safeBaseSize + 3;
                        },
                        pointHoverBackgroundColor: (context) => {
                            const datetime = datetimes[context?.dataIndex],
                                  isHoliday = datetime && checkIsHoliday && callbackRenderPointStyle(meansOfTransport, [datetime])?.includes?.("star");

                            return isHoliday ? color : "#FFFFFF";
                        },
                        pointHoverBorderWidth: (context) => {
                            const datetime = datetimes[context?.dataIndex],
                                  isHoliday = datetime && checkIsHoliday && callbackRenderPointStyle(meansOfTransport, [datetime])?.includes?.("star");

                            return isHoliday ? 4 : 3;
                        },
                        pointStyleLegend: this.createCanvasPointStyleLegend(color, isComplementaryDataset),
                        datetimes,
                        isSVAvailable: meansOfTransport === "Anzahl_Schwerverkehr" && this.currentMeansOfTransport === "Anzahl_Kfz",
                        isKFZAvailable: meansOfTransport === "Anzahl_Kfz" && this.currentMeansOfTransport === "Anzahl_Schwerverkehr"
                    });

                    if (datetimes.length > 0 && typeof callbackRenderPointStyle === "function" && callbackRenderPointStyle(meansOfTransport, datetimes)?.includes?.("star")) {
                        datasets.push(holidayData);
                    }
                });
            });

            return {labels: labelsXAxis, datasets};
        },
        /**
         * creates a canvas with the given color and shape for the legend
         * @param {String} color the color of the point style
         * @param {Boolean} dashed if true, the point style will be dashed (only for rectangles)
         * @returns {HTMLCanvasElement}  a canvas element to use as point style in legend
         */
        createCanvasPointStyleLegend (color, dashed = false) {
            const canvas = document.createElement("canvas");

            canvas.width = 25;
            canvas.height = 15;

            const ctx = canvas.getContext("2d");
            const x = 4;
            const y = 4;
            const width = 17;
            const height = 7;
            const borderRadius = 2;

            if (dashed) {
                const patternCanvas = document.createElement("canvas");

                patternCanvas.width = 4;
                patternCanvas.height = height;
                const patternCtx = patternCanvas.getContext("2d");

                patternCtx.fillStyle = color;
                patternCtx.fillRect(0, 0, 2, height);
                const pattern = ctx.createPattern(patternCanvas, "repeat");

                ctx.fillStyle = pattern;
            }
            else {
                ctx.fillStyle = color;
            }

            ctx.beginPath();
            ctx.moveTo(x + borderRadius, y);
            ctx.lineTo(x + width - borderRadius, y);
            ctx.arcTo(x + width, y, x + width, y + borderRadius, borderRadius);
            ctx.lineTo(x + width, y + height - borderRadius);
            ctx.arcTo(x + width, y + height, x + width - borderRadius, y + height, borderRadius);
            ctx.lineTo(x + borderRadius, y + height);
            ctx.arcTo(x, y + height, x, y + height - borderRadius, borderRadius);
            ctx.lineTo(x, y + borderRadius);
            ctx.arcTo(x, y, x + borderRadius, y, borderRadius);
            ctx.closePath();
            ctx.fill();

            return canvas;
        },
        /**
         * returns the config for chart js
         * @param {Object} data the data to use
         * @param {Object} givenOptions an object with the callbacks and values used to create the config
         * @returns {Object}  an object to use as config for chartjs
         */
        getChartJsConfig (data, givenOptions) {
            const options = Object.assign({
                colorTooltipFont: "#555555",
                colorTooltipBack: "#f0f0f0",
                setTooltipValue: tooltipItem => {
                    return tooltipItem.value;
                },
                fontSizeGraph: 10,
                fontSizeLegend: 12,
                fontColorGraph: "black",
                fontColorLegend: "#555555",
                xAxisTicks: 0,
                yAxisTicks: 0,
                renderLabelXAxis: datetime => datetime,
                renderLabelYAxis: yValue => yValue,
                descriptionXAxis: "",
                descriptionYAxis: ""
            }, givenOptions);

            return {
                type: "line",
                data,
                options: {
                    maintainAspectRatio: false,
                    interaction: {
                        mode: "index",
                        intersect: false,
                        axis: "x"
                    },
                    events: ["mousemove", "mouseout", "click", "touchstart", "touchmove"],
                    transitions: {
                        active: {
                            animation: {
                                duration: 300,
                                easing: "easeOutQuad",
                                properties: ["x", "y", "radius", "backgroundColor"]
                            }
                        }
                    },
                    elements: {
                        point: {
                            radius: 10,
                            hoverRadius: 10,
                            hitRadius: 20
                        }
                    },
                    plugins: {
                        title: {
                            display: false
                        },
                        legend: {
                            display: true,
                            labels: {
                                usePointStyle: true,
                                boxWidth: 14,
                                boxHeight: 14,
                                padding: 20,
                                generateLabels: chart => {
                                    const chartData = chart.data,
                                          legends = Array.isArray(chartData.datasets) ? chartData.datasets.map((dataset, i) => {
                                              return {
                                                  text: dataset.label,
                                                  backgroundColor: dataset.backgroundColor,
                                                  borderColor: dataset.borderColor,
                                                  borderWidth: dataset.borderWidth,
                                                  pointStyle: dataset.pointStyleLegend,
                                                  pointRadius: dataset.pointRadius,
                                                  pointHoverRadius: dataset.pointHoverRadius,
                                                  strokeStyle: dataset.borderColor,
                                                  fillStyle: dataset.borderColor,
                                                  spanGaps: dataset.spanGaps,
                                                  hidden: !chart.isDatasetVisible(i),
                                                  datasetIndex: i
                                              };
                                          }, this) : [];

                                    return legends;
                                },
                                fontSize: options.fontSizeLegend,
                                fontColorLegend: options.fontColorLegend
                            },
                            position: "bottom",
                            align: "center"
                        },
                        tooltip: {
                            enabled: true,
                            mode: "index",
                            intersect: false,
                            backgroundColor: "#ffffff",
                            bodyColor: "#1e293b",
                            borderColor: "#94a3b8",
                            borderWidth: 1.5,
                            cornerRadius: 8,
                            caretSize: 6,
                            caretPadding: 12,
                            padding: {top: 10, bottom: 10, left: 14, right: 14
                            },
                            boxWidth: 16,
                            boxHeight: 4,
                            boxPadding: 8,
                            usePointStyle: false,
                            callbacks: {
                                labelColor: function (context) {
                                    const dataset = context.dataset,
                                          isDashed = dataset.borderDash && dataset.borderDash.length > 0;

                                    return {
                                        borderColor: dataset.borderColor,
                                        backgroundColor: isDashed ? "transparent" : dataset.borderColor,
                                        borderWidth: 2,
                                        borderDash: dataset.borderDash || []
                                    };
                                },
                                label: (tooltipItem, chartJsData) => {
                                    if (
                                        typeof chartJsData === "object"
                                        && Array.isArray(chartJsData.datasets)
                                        && typeof chartJsData.datasets[tooltipItem.datasetIndex] === "object"
                                        && Array.isArray(chartJsData.datasets[tooltipItem.datasetIndex].datetimes)
                                        && chartJsData.datasets[tooltipItem.datasetIndex].datetimes[tooltipItem.index]
                                    ) {
                                        tooltipItem.datetime = chartJsData.datasets[tooltipItem.datasetIndex].datetimes[tooltipItem.index];
                                    }
                                    else if (typeof tooltipItem === "object") {
                                        tooltipItem.datetime = tooltipItem.dataset.datetimes[tooltipItem.dataIndex];
                                    }

                                    return options.setTooltipValue(tooltipItem);
                                },
                                title: () => {
                                    return false;
                                }
                            }
                        }
                    },
                    hover: {
                        mode: "index",
                        intersect: false,
                        onHover: function (e, elements, chart) {
                            const target = e.native?.target ?? e.target,
                                  activePoints = chart.getElementsAtEventForMode(e, "index", {intersect: false}, false);

                            if (!target) {
                                return;
                            }

                            target.style.cursor = activePoints.length ? "pointer" : "default";
                        }
                    },
                    scales: {
                        x: {
                            display: true,
                            beginAtZero: true,
                            grid: {
                                display: false
                            },
                            ticks: {
                                callback: (value, index) => {
                                    const totalLabels = data.labels.length;

                                    if (totalLabels > 7 && index % 2 !== 0) {
                                        return "";
                                    }
                                    return options.renderLabelXAxis(data.labels[index]);
                                }
                            }
                        },
                        y: {
                            display: true,
                            beginAtZero: true,
                            ticks: {
                                fontSize: options.fontSizeGraph,
                                fontColor: options.fontColorGraph,
                                maxTicksLimit: options.yAxisTicks,
                                callback: (yValue) => {
                                    return options.renderLabelYAxis(yValue);
                                }
                            },
                            grid: {
                                display: true,
                                drawBorder: true,
                                drawOnChartArea: true
                            },
                            title: {
                                display: Boolean(options.descriptionYAxis),
                                text: options.descriptionYAxis
                            }
                        }
                    }
                }
            };
        }
    }
};
</script>

<template>
    <div class="charts">
        <LinechartItem
            :data="chartConfig.data"
            :given-options="chartConfig.options"
        />
    </div>
</template>

<style lang="scss" scoped>
    .charts {
       position: relative;
        width: 100%;
        height: 400px;
    }
</style>

<style lang="scss">
    .trafficCount-gfi .dateSelector {
        margin-top: 1rem;
        margin-bottom: 1rem;
    }

    @media (max-width: 580px) {
        .trafficCount-gfi .dateSelector {
            width: 100%;
            padding: 0 10px;
            margin-top: 10px;
            margin-right: 0;
            margin-bottom: 20px;
        }
        #dayDateInput, #weekDateInput, #yearDateInput {
            text-align: center;
        }
    }
</style>
