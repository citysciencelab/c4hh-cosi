/**
 * @class ChartDataset
 */
export default class ChartDataset {
    /**
     * Constructs a Chart Dataset to use with chart-js
     * @param {Object} params - the constructor params
     * @param {String} params.name - the name of the chart to display
     * @param {Object} params.data - the data to visualize, see chart-js documentation
     * @param {{backgroundColor: String, borderColor: String, data: number[], label: String}[]} params.data.datasets - the datasets in the chart
     * @param {String[]} params.data.labels - the labels for the datasets
     * @param {"BarChart" | "LineChart"} params.type - the type of the Chart
     * @param {Boolean} params.beginAtZero - Defines if yAxes should begin at zero or not.
     * @param {String[]} [params.scaleLabels] - the labels of the axes
     * @param {String} [params.id="cg"] - the ID of the chart, auto-assigned if not provided
     * @param {String} [params.id=""] - the source tool where the chart was created, auto-assigned if not provided
     * @param {String} [params.color="blue"] - the ID of the chart, auto-assigned if not provided
     * @param {String} [params.sub=false] - is the chart part of multiple visualizations of the same data?
     * @param {String} [params.sub_graph] - index of the chart within the sub index, auto-assigned if not provided
     * @param {String} [params.sub_index] - index of the chart group, auto-assigned if not provided
     * @param {String} [params.sub_length] - length of the chart group, auto-assigned if not provided
     * @param {String} [params.options] - optional chart options to override default
     */
    constructor ({id = "cg", name, data, type, beginAtZero = false, stacked = false, scaleLabels, color = "blue", source = "", sub = false, sub_graph, sub_index, sub_length, options}) {
        if (!(name && data && type && typeof name === "string" && (typeof type === "string" || Array.isArray(type)) && typeof data === "object")) {
            throw new EvalError(`ChartDataset: 'name', 'data' and 'type' musst be provided in the options. Got ${name}, ${data} and ${type} instead`);
        }
        this.type = type;
        this.id = id;
        this.name = name;
        this.color = color;
        this.data = data;
        this.scaleLabels = scaleLabels;
        this.source = source;
        this.source = source;
        this.beginAtZero = beginAtZero;
        this.stacked = stacked;
        this.sub = sub;
        this.sub_graph = sub_graph;
        this.sub_index = sub_index;
        this.sub_length = sub_length;
        this.options = options;

        // auto generate cgid
        this.cgid = id + "-" + name;
    }
}
