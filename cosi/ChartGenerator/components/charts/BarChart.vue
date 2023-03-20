<script>
import {Bar} from "vue-chartjs";
import beautifyKey from "../../../../../src/utils/beautifyKey";
import deepAssign from "../../../../../src/utils/deepAssign";
import fixColor from "../../utils/fixColor";

export default {
    name: "BarChart",
    extends: Bar,
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
            scales: {
                xAxes: [{
                    ticks: {
                        beginAtZero: false
                    },
                    scaleLabel: {
                        display: true,
                        labelString: ""
                    }
                }],
                yAxes: [{
                    ticks: {
                        beginAtZero: false
                    },
                    scaleLabel: {
                        display: true,
                        labelString: ""
                    }
                }]
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
            this._options.scales.yAxes[0].stacked = this.chartData.stacked || false;
            this._options.scales.xAxes[0].stacked = this.chartData.stacked || false;
            this._options.scales.yAxes[0].ticks.beginAtZero = this.chartData.beginAtZero || false;

            this._options.scales.yAxes[0].scaleLabel.labelString = this.chartData.scaleLabels?.[0];
            this._options.scales.xAxes[0].scaleLabel.labelString = this.chartData.scaleLabels?.[1];
            this._options.title.text = beautifyKey(this.chartData.name);
            this.renderChart(this.chartData.data, this._options);
        }
    }
};
</script>
