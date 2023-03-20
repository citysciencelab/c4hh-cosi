<script>
import ChartJs from "chart.js";

export default {
    name: "TrafficCountCompDiagram",
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
        }
    },
    data () {
        return {
            chartData: {},
            ctx: "",
            colors: ["#337ab7", "#d73027", "#fc8d59", "#91bfdb", "#542788"],
            fontColorGraph: "black",
            fontColorLegend: "#555555",
            fontSizeGraph: 10,
            fontSizeLegend: 12,
            gridLinesColor: "black",
            colorTooltipFont: "#555555",
            colorTooltipBack: "#f0f0f0",
            /**
             * the animation to use on diagram update
             * @see update https://www.chartjs.org/docs/latest/developers/api.html?h=update(config)
             */
            updateAnimation: {},

            chart: null
        };
    },
    watch: {
        apiData (newData, oldValue) {
            if (!oldValue.length) {
                this.chartData = this.createDataForDiagram(newData, this.colors, this.renderLabelLegend, this.renderPointStyle, this.renderPointSize);
                this.createChart(this.chartData, this.ctx);
            }
            else if (Array.isArray(newData) && newData.length) {
                this.chart.data = this.createDataForDiagram(newData, this.colors, this.renderLabelLegend, this.renderPointStyle, this.renderPointSize);
                this.chart.update(this.updateAnimation);
            }
            else {
                this.chart.destroy();
            }
        }
    },
    mounted () {
        this.chartData = this.createDataForDiagram(this.apiData, this.colors, this.renderLabelLegend, this.renderPointStyle, this.renderPointSize);
        this.ctx = this.$el.getElementsByTagName("canvas")[0].getContext("2d");

        /**
         * @see afterFit https://www.chartjs.org/docs/latest/axes/?h=afterfit
         * @returns {Void}  -
         */
        ChartJs.Legend.prototype.afterFit = function () {
            this.height = this.height + 10;
        };

        this.createChart(this.chartData, this.ctx);
    },
    methods: {
        /**
         * Creating the diagram from chart js
         * @param {Object[]} data parsed for chartjs format
         * @param {html} ctx the canvas container for diagram
         * @returns {Void}  -
         */
        createChart (data, ctx) {
            this.chart = new ChartJs(ctx, this.getChartJsConfig(data, {
                colorTooltipFont: this.colorTooltipFont,
                colorTooltipBack: this.colorTooltipBack,
                setTooltipValue: this.setTooltipValue,
                fontSizeGraph: this.fontSizeGraph,
                fontSizeLegend: this.fontSizeLegend,
                fontColorGraph: this.fontColorGraph,
                fontColorLegend: this.fontColorLegend,
                gridLinesColor: this.gridLinesColor,
                xAxisTicks: this.xAxisTicks,
                yAxisTicks: this.yAxisTicks,
                renderLabelXAxis: this.renderLabelXAxis,
                renderLabelYAxis: this.renderLabelYAxis,
                descriptionXAxis: this.descriptionXAxis,
                descriptionYAxis: this.descriptionYAxis
            }));
        },
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
            const meansOfTransportKey = Object.keys(apiData[0])[0],
                labelsXAxis = [],
                datasets = [],
                keysOfFirstDataset = Object.keys(apiData[0][meansOfTransportKey]);

            keysOfFirstDataset.forEach(datetime => {
                labelsXAxis.push(datetime);
            });

            apiData.forEach((dataObj, idx) => {
                if (!Object.prototype.hasOwnProperty.call(dataObj, meansOfTransportKey)) {
                    return;
                }
                const datetimes = Object.keys(dataObj[meansOfTransportKey]),
                    holidayData = {
                        borderColor: Array.isArray(colors) ? colors[idx] : "",
                        fill: false,
                        label: this.$t("additional:modules.tools.gfi.themes.trafficCount.holidaySign"),
                        pointBorderColor: Array.isArray(colors) ? colors[idx] : "",
                        pointBackgroundColor: Array.isArray(colors) ? colors[idx] : "",
                        pointRadius: 3,
                        pointStyle: "star"
                    };

                datasets.push({
                    label: datetimes.length > 0 && typeof callbackRenderLabelLegend === "function" ? callbackRenderLabelLegend(datetimes[0]) : "",
                    data: Object.values(dataObj[meansOfTransportKey]),
                    backgroundColor: Array.isArray(colors) ? colors[idx] : "",
                    borderColor: Array.isArray(colors) ? colors[idx] : "",
                    spanGaps: false,
                    fill: false,
                    borderWidth: 1,
                    pointRadius: datetimes.length > 0 && typeof callbackRenderPointSize === "function" ? callbackRenderPointSize(datetimes) : 2,
                    pointHoverRadius: datetimes.length > 0 && typeof callbackRenderPointSize === "function" ? callbackRenderPointSize(datetimes) : 2,
                    pointStyle: datetimes.length > 0 && typeof callbackRenderPointStyle === "function" ? callbackRenderPointStyle(datetimes) : "",
                    datetimes
                });

                if (datetimes.length > 0 && typeof callbackRenderPointStyle === "function" && callbackRenderPointStyle(datetimes).includes("star")) {
                    datasets.push(holidayData);
                }
            });

            return {labels: labelsXAxis, datasets};
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
                gridLinesColor: "black",
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
                    title: {
                        display: false
                    },
                    elements: {
                        line: {
                            tension: 0
                        }
                    },
                    legend: {
                        display: true,
                        onClick: (e) => e.stopPropagation(),
                        labels: {
                            usePointStyle: true,
                            generateLabels: chart => {
                                const chartData = chart.data,
                                    legends = Array.isArray(chartData.datasets) ? chartData.datasets.map((dataset, i) => {
                                        return {
                                            text: dataset.label,
                                            backgroundColor: dataset.backgroundColor,
                                            borderColor: dataset.borderColor,
                                            borderWidth: dataset.borderWidth,
                                            pointStyle: dataset.pointStyle,
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
                        align: "start"
                    },
                    tooltips: {
                        bodyFontColor: options.colorTooltipFont,
                        backgroundColor: options.colorTooltipBack,
                        yAlign: "bottom",
                        titleAlign: "center",
                        bodyAlign: "center",
                        custom: (tooltip) => {
                            if (!tooltip) {
                                return;
                            }
                            // disable displaying the color box;
                            tooltip.displayColors = false;
                        },
                        callbacks: {
                            // use label callback to return the desired label
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
                                    tooltipItem.datetime = tooltipItem.label;
                                }

                                return options.setTooltipValue(tooltipItem);
                            },
                            // remove title
                            title: () => {
                                return false;
                            }
                        }
                    },
                    hover: {
                        mode: "nearest",
                        intersect: true,
                        onHover: function (e) {
                            const point = this.getElementAtEvent(e);

                            if (point.length) {
                                e.target.style.cursor = "pointer";
                            }
                            else {
                                e.target.style.cursor = "default";
                            }
                        }
                    },
                    scales: {
                        xAxes: [{
                            display: true,
                            ticks: {
                                fontSize: options.fontSizeGraph,
                                fontColor: options.fontColorGraph,
                                beginAtZero: true,
                                autoSkip: true,
                                maxTicksLimit: options.xAxisTicks,
                                callback: (xValue) => {
                                    return options.renderLabelXAxis(xValue);
                                }
                            },
                            gridLines: {
                                color: options.gridLinesColor,
                                display: true,
                                drawBorder: true,
                                drawOnChartArea: false
                            },
                            scaleLabel: {
                                display: Boolean(options.descriptionXAxis),
                                labelString: options.descriptionXAxis
                            }
                        }],
                        yAxes: [{
                            display: true,
                            ticks: {
                                beginAtZero: true,
                                fontSize: options.fontSizeGraph,
                                fontColor: options.fontColorGraph,
                                maxTicksLimit: options.yAxisTicks,
                                callback: (yValue) => {
                                    return options.renderLabelYAxis(yValue);
                                },
                                stepSize: 1
                            },
                            gridLines: {
                                color: options.gridLinesColor,
                                display: true,
                                drawBorder: true,
                                drawOnChartArea: false
                            },
                            scaleLabel: {
                                display: Boolean(options.descriptionYAxis),
                                labelString: options.descriptionYAxis
                            }
                        }]
                    }
                }
            };
        }
    }
};
</script>

<template>
    <div class="graph">
        <canvas />
    </div>
</template>

<style lang="scss" scoped>
    div.graph {
        width: 580px;
        min-height: 285px;
        padding-bottom: 15px;
    }

    @media (max-width: 580px) {
        div.graph {
            width: inherit;
        }
    }
</style>

<style lang="scss">
    .trafficCount-gfi .dateSelector {
        width: 230px;
        height: 35px;
        float: right;
        margin-right: 10px;
        margin-top: -3.7em;
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
