
<script>
import {Pie as PieChartGenerator} from "vue-chartjs";
import {
    Chart as ChartJS,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    CategoryScale
} from "chart.js";
import beautifyKey from "../../../../../src/shared/js/utils/beautifyKey";
import deepAssign from "../../../../../src/shared/js/utils/deepAssign";
import fixColor from "../../utils/fixColor";

ChartJS.register(Title, Tooltip, Legend, ArcElement, CategoryScale);

export default {
    name: "PieChart",
    components: {
        PieChartGenerator
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
            chartData1: {
                labels: ["VueJs", "EmberJs", "ReactJs", "AngularJs"],
                datasets: [
                    {
                        backgroundColor: ["#41B883", "#E46651", "#00D8FF", "#DD1B16"],
                        data: [40, 20, 80, 10]
                    }
                ]
            },
            chartOptions: {
                responsive: true,
                maintainAspectRatio: false
            }
        };
    },
    computed: {
        chartData () {
            if (!this.datasets) {
                return null;
            }

            fixColor(this.datasets);

            return {
                name: this.datasets.name,
                labels: this.datasets.label,
                datasets: [this.datasets.datasets]
            };
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

            this._options.plugins.title.text = beautifyKey(this.chartData.name);
        }
    }
};
</script>

<template>
    <PieChartGenerator
        v-if="chartData"
        :options="_options"
        :data="chartData"
    />
</template>
