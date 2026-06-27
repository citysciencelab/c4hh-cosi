
<script>
import {Line as LineChartGenerator} from "vue-chartjs";
import {
    Chart as ChartJS,
    Title,
    Tooltip,
    Legend,
    LineElement,
    LinearScale,
    CategoryScale,
    PointElement
} from "chart.js";
import {rgb} from "d3-color";
import beautifyKey from "../../../../../src/shared/js/utils/beautifyKey";
import deepAssign from "../../../../../src/shared/js/utils/deepAssign";
import fixColor from "../../utils/fixColor";

ChartJS.register(
    Title,
    Tooltip,
    Legend,
    LineElement,
    LinearScale,
    CategoryScale,
    PointElement
);
export default {
    name: "LineChart",
    components: {
        LineChartGenerator
    },
    props: {
        datasets: {
            type: Object,
            default: null
        },
        options: {
            type: Object,
            required: false,
            default: () => ({})
        }
    },
    data () {
        return {
            defaultOptions: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: "",
                        position: "top"
                    }
                },
                scales: {
                    x: {
                        display: true,
                        beginAtZero: false,
                        stacked: false,
                        title: {
                            display: true,
                            text: ""
                        }
                    },
                    y: {
                        display: true,
                        beginAtZero: false,
                        stacked: false,
                        title: {
                            display: true,
                            text: ""
                        }
                    }
                },
                tooltips: {
                    callbacks: {
                        footer: (item, data) => {
                            const dataset = data.datasets[item[0].datasetIndex],
                                footer = dataset.tooltip;

                            return footer;
                        }
                    }
                }
            },
            key: ""
        };
    },
    computed: {
        chartData () {
            if (!this.datasets) {
                return null;
            }

            this.datasets.data.datasets.forEach(dataset => {
                dataset.backgroundColor = rgb(0, 0, 0, 0);
            });

            return {...fixColor(this.datasets)};
        },
        _options () {
            return deepAssign(this.defaultOptions, this.options);
        }
    },
    watch: {
        chartData () {
            this.prepareRendering();
        }
    },
    mounted () {
        this.prepareRendering();
    },
    methods: {
        /**
         * Preparing the rendering data.
         * @returns {void}
         */
        prepareRendering () {
            if (!this.chartData) {
                return;
            }

            this._options.scales.y.beginAtZero = this.chartData.beginAtZero || false;

            this._options.scales.y.title.text = this.chartData.scaleLabels?.[0];
            this._options.scales.x.title.text = this.chartData.scaleLabels?.[1];
            this._options.scales.x.stacked = this.chartData.stacked;
            this._options.scales.y.stacked = this.chartData.stacked;

            this._options.plugins.title.text = beautifyKey(this.chartData.name);
            this.key = this.chartData?.scaleLabels?.[0] + this.chartData?.stacked;
        }
    }
};
</script>

<template>
    <LineChartGenerator
        v-if="chartData?.data"
        :key="key"
        :options="_options"
        :data="chartData?.data"
    />
</template>
