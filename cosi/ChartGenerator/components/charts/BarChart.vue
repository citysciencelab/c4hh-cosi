<script>
import {Bar as BarChartGenerator} from "vue-chartjs";
import {
    Chart as ChartJS,
    Title,
    Tooltip,
    Legend,
    BarElement,
    CategoryScale,
    LinearScale
} from "chart.js";
import beautifyKey from "../../../../../src/shared/js/utils/beautifyKey";
import deepAssign from "../../../../../src/shared/js/utils/deepAssign";
import fixColor from "../../utils/fixColor";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default {
    name: "BarChart",
    components: {
        BarChartGenerator
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
                        text: "Custom Chart Title",
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
    async mounted () {
        this.prepareRendering();
    },
    methods: {
        /**
         * Preparing the rendering data.
         * @returns {void}
         */
        prepareRendering () {
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
    <BarChartGenerator
        v-if="chartData?.data"
        :key="key"
        :data="chartData?.data"
        :options="_options"
    />
</template>
