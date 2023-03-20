
<script>
import {Pie} from "vue-chartjs";
import beautifyKey from "../../../../../src/utils/beautifyKey";
import deepAssign from "../../../../../src/utils/deepAssign";
import fixColor from "../../utils/fixColor";

export default {
    name: "PieChart",
    extends: Pie,
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
            title: {
                display: true,
                text: "",
                position: "top"
            },
            responsive: true,
            maintainAspectRatio: false
        }
    }),
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
        prepareRendering () {
            if (!this.chartData) {
                return;
            }

            this._options.title.text = beautifyKey(this.chartData.name);
            this.renderChart(this.chartData, this._options);
        }
    }
};
</script>
