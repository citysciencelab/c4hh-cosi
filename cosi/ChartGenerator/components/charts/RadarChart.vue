<script>
import {Radar as RadarChartGenerator} from "vue-chartjs";
import {
    Chart as ChartJS,
    Title,
    Tooltip,
    Legend,
    PointElement,
    LineElement,
    RadialLinearScale
} from "chart.js";
import beautifyKey from "../../../../../src/shared/js/utils/beautifyKey";
import deepAssign from "../../../../../src/shared/js/utils/deepAssign";
import fixColor from "../../utils/fixColor";

ChartJS.register(
    Title,
    Tooltip,
    Legend,
    PointElement,
    RadialLinearScale,
    LineElement
);

export default {
    name: "RadarChart",
    components: {
        RadarChartGenerator
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
                scale: {
                    x: {
                        display: true,
                        beginAtZero: false,
                        stacked: false,
                        title: {
                            display: true,
                            text: ""
                        },
                        grid: {},
                        angleLines: {}
                    },
                    y: {
                        display: true,
                        beginAtZero: false,
                        stacked: false,
                        title: {
                            display: true,
                            text: ""
                        },
                        grid: {},
                        angleLines: {}
                    }
                },
                tooltips: {
                    callbacks: {
                        title: (item, data) => {
                            return data.labels[item[0].index];
                        },
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
            if (!this.chartData) {
                return;
            }

            this._options.scales.y.beginAtZero = this.chartData.beginAtZero || false;
            this._options.plugins.title.text = beautifyKey(this.chartData.name);
            this.key = this.chartData?.scaleLabels?.[0];
        }
    }
};
</script>

<RadarChartGenerator
    v-if="chartData?.data"
    :key="key"
    :options="_options"
    :data="chartData?.data"
/>
