<script>
// import Plotly from "plotly.js-dist";
import {mapGetters} from "vuex";

export default {
    name: "ChartComponent",
    props: {
        type: {
            type: String,
            default: "bar"
        },
        chartConfigs: {
            type: Object,
            default: () => ({})
        }
    },
    computed: {
        ...mapGetters("Modules/SimulationTool", ["jobResultData"])
    },
    watch: {
        jobResultData: {
            handler () {
                this.drawChart();
            },
            deep: true,
            immediate: true
        },
        type () {
            this.drawChart();
        },
        chartConfigs () {
            this.drawChart();
        }
    },
    mounted () {
        this.drawChart(this.chartData);
    },
    methods: {
        /**
        drawChart () {
            if (!this.$refs.plotlyChart) {
                return;
            }

            const config = {
                    displayModeBar: false
                },
                plotlyData = this.getPlotlyData(),
                layout = this.guessLayoutByData();

            Plotly.newPlot(this.$refs.plotlyChart, plotlyData, layout, config);
        },
        */
        guessLayoutByData () {
            const firstConfig = this.chartConfigs[Object.keys(this.chartConfigs)[0]];

            return {
                xaxis: {
                    title: firstConfig.xProp.split(".").pop()
                },
                yaxis: {
                    title: firstConfig.yProp.split(".").pop()
                },
                showlegend: Object.keys(this.chartConfigs).length > 1,
                legend: {
                    x: 1,
                    xanchor: "right",
                    y: 1
                }
            };
        },
        getValue (obj, prop) {
            try {
                return prop.split(".").reduce((acc, curr) => acc[curr], obj);
            }
            catch {
                return undefined;
            }
        },
        getPlotlyData () {


            if (!this.jobResultData || !this.type || Object.keys(this.chartConfigs).length === 0) {
                return [];
            }

            const jobIds = Object.keys(this.chartConfigs),
                unsortedTraces = jobIds.map(jobId => {
                    const chartConfig = this.chartConfigs[jobId],

                        root = this.getValue(this.jobResultData[jobId], chartConfig.rootProp);

                    if (!Array.isArray(root)) {
                        return [];
                    }

                    return {
                        name: jobId,
                        x: root.map(item => Number(this.getValue(item, chartConfig.xProp))),
                        y: chartConfig.yProp ? root.map(item => Number(this.getValue(item, chartConfig.yProp))) : undefined,
                        type: this.type
                    };
                });

            return unsortedTraces.map(trace => {
                const sortedIndices = trace.x
                    .map((value, index) => ({value, index}))
                    .sort((a, b) => a.value - b.value)
                    .map(({index}) => index);

                return {
                    x: sortedIndices.map(i => trace.x[i]),
                    y: trace.y ? sortedIndices.map(i => trace.y[i]) : undefined,
                    type: trace.type,
                    name: trace.name
                };
            });

        }
    }
};

</script>

<template>
    <div
        ref="plotlyChart"
        class="plotly-chart"
    />
</template>

<style scoped>
  .plotly-chart {
    width: 100%;
    height: 100%;
  }
</style>
