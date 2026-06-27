
<script>
import {Scatter as ScatterChartGenerator} from "vue-chartjs";
import {
    Chart as ChartJS,
    Title,
    Tooltip,
    Legend,
    LineElement,
    CategoryScale,
    PointElement,
    LinearScale
} from "chart.js";
import beautifyKey from "../../../../../src/shared/js/utils/beautifyKey";
import {color as rgb} from "d3-color";
import deepAssign from "../../../../../src/shared/js/utils/deepAssign";
import fixColor from "../../utils/fixColor";

ChartJS.register(
    Title,
    Tooltip,
    Legend,
    LineElement,
    CategoryScale,
    PointElement,
    LinearScale
);

export default {
    name: "ScatterChart",
    components: {
        ScatterChartGenerator
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
                        title: (item, data) => {
                            const dataset = data.datasets[item[0].datasetIndex],
                                d = dataset.data[item[0].index];
                            let title = dataset.label;

                            if (dataset.type !== "line") {
                                title += ` (${d.timestamp})`;
                            }

                            return title;
                        },
                        footer: (item, data) => {
                            const dataset = data.datasets[item[0].datasetIndex],
                                d = dataset.data[item[0].index],
                                stdDev = Math.round((d.stdDev + Number.EPSILON) * 1000) / 1000,
                                corr = Math.round((dataset.correlation + Number.EPSILON) * 1000) / 1000,
                                footer = dataset.type === "line" ? `Korrelation: ${corr}` : `Abweichung: ${stdDev}`;

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

            const datasets = {...fixColor(this.datasets)};

            for (const dataset of datasets.data.datasets) {
                if (dataset.type === "line") {
                    dataset.backgroundColor = rgb(0, 0, 0, 0);
                }
            }

            return datasets;
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

            this._options.scales.y.title.text = this.chartData.scaleLabels?.[0];
            this._options.scales.x.title.text = this.chartData.scaleLabels?.[1];

            this._options.plugins.title.text = beautifyKey(this.chartData.name);
            this.key = this.chartData?.scaleLabels?.[0];
        }
    }
};
</script>

<ScatterChartGenerator
    v-if="chartData?.data"
    :key="key"
    :options="_options"
    :data="chartData?.data"
/>
