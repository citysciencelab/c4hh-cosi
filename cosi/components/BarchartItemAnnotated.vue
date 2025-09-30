<script>
// import annotationPlugin from "chartjs-plugin-annotation";
import ChartJs from "chart.js/auto";
import deepAssign from "@shared/js/utils/deepAssign";
import thousandsSeparator from "@shared/js/utils/thousandsSeparator";

// ChartJs.register(annotationPlugin);

export default {
    name: "BarchartItemAnnotated",
    props: {
        /**
         * The options to override the default options with.
         * Please remember to check the behavior of src/utils/deepAssign.js.
         */
        givenOptions: {
            type: Object,
            required: false,
            default: null
        },
        /**
         * The data for the barchart to hand over to chartJS data attribute
         * @see https://www.chartjs.org/docs/latest/charts/bar.html
         */
        data: {
            type: Object,
            required: true
        }
    },
    data () {
        return {
            defaultOptions: {
                responsive: true,
                plugins: {
                    legend: {
                        align: "start"
                    },
                    tooltips: {}
                },
                scales: {
                    y: {
                        ticks: {
                            precision: 0,
                            beginAtZero: true,
                            callback: (value) => {
                                return thousandsSeparator(value);
                            }
                        }
                    }
                }
            }
        };
    },
    watch: {
        data (newData) {
            this.resetChart(newData);
        },

        givenOptions () {
            this.defaultOptions.animation = false;
            this.resetChart(this.data);
            this.defaultOptions.animation = true;
        }
    },
    mounted () {
        this.$nextTick(() => {
            /**
             * @see afterFit https://www.chartjs.org/docs/latest/axes/?h=afterfit
             * @returns {void}
             */
            this.resetChart(this.data);
        });
    },
    methods: {
        /**
         * Destroys the old charts and creates a new chart.
         * @param {Object} data The data for diagram.
         * @pre the old chart is shown or no chart is initialized.
         * @post the chart based on current data and props is shown.
         * @returns {void}
         */
        resetChart (data) {
            const ctx = this.$refs.canvas.getContext("2d"),
                config = {
                    type: "bar",
                    data: data,
                    options: this.getChartJsOptions(this.defaultOptions, this.givenOptions)
                };

            ChartJs.getChart(this.$refs.canvas)?.destroy();
            if (this.chart instanceof ChartJs) {
                this.destroyChart();
            }

            this.chart = new ChartJs(ctx, config);
        },
        /**
         * Destroys the old charts.
         * @returns {void}
         */
        destroyChart () {
            this.chart.destroy();
        },
        /**
         * Replace default options with given options on hand deepAssign method and returns the options for chart js.
         * @param {Object} defaultOptions An object with the default options following chartJS options (see https://www.chartjs.org/docs/latest/general/options.html).
         * @param {Object} givenOptions An object with given options following chartJS options (see https://www.chartjs.org/docs/latest/general/options.html).
         * @returns {Object} An object to use as options for chartjs.
         */
        getChartJsOptions (defaultOptions, givenOptions) {
            if (typeof defaultOptions !== "object" || defaultOptions === null) {
                return typeof givenOptions === "object" && givenOptions !== null ? givenOptions : {};
            }
            return deepAssign(defaultOptions, givenOptions);
        }
    }
};
</script>

<template>
    <canvas ref="canvas" />
</template>
