<script>
import {Radar} from "vue-chartjs";
import beautifyKey from "../../../../../src/utils/beautifyKey";
import deepAssign from "../../../../../src/utils/deepAssign";
import fixColor from "../../utils/fixColor";

export default {
    name: "RadarChart",
    extends: Radar,
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
    data: () => ({
        defaultOptions: {
            responsive: true,
            maintainAspectRatio: false,
            title: {
                display: true,
                text: "",
                position: "top"
            },
            scale: {
                angleLines: {},
                gridLines: {},
                pointLabels: {},
                ticks: {
                    beginAtZero: true
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
        }
    }),
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
        prepareRendering () {
            if (!this.chartData) {
                return;
            }

            this._options.scale.ticks.beginAtZero = this.chartData.beginAtZero || true;
            this._options.title.text = beautifyKey(this.chartData.name);
            this.renderChart(this.chartData.data, this._options);
        }
    }
};
</script>
