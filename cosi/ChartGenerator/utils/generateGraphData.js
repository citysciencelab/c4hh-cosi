import {color} from "d3-color";
import generateColorScale from "./generateColorScale";
import beautifyKey from "../../../../src/utils/beautifyKey";

/**
         * @description Generates the graph component and passes the data dynamically.
         * @param {Object} arg dataset containing the data and a String for type property.
         * @param {Object} type type
         * @returns {void}
         */
export default function generateGraphData (arg, type) {
    const dataset = JSON.parse(JSON.stringify(arg)),
        colorRange = generateColorScale(dataset);

    dataset.data.datasets.forEach((set, index) => {
        let getColor = colorRange(index),
            d3Color = color(getColor);

        if (!getColor) {
            getColor = "rgba(0, 40, 255, 1)";
            d3Color = color(getColor);
        }

        d3Color.opacity = 0.5;
        set.borderColor = getColor;
        set.backgroundColor = d3Color;
    });

    if (type === "PieChart") {
        return createPieChartData(dataset);
    }

    return dataset;
}

/**
 * @description Modifies the dataset to match chart.js requirements for PieCharts.
 * @param {Object} dataset dataset containing the data to be rendered as graph.
 * @returns {Array} Transformed Dataset.
 */
function createPieChartData (dataset) {
    const newPieChartData = [];

    dataset.data.labels.forEach((label, i) => {
        const obj = {
            name: beautifyKey(dataset.name) + " - " + label,
            type: "PieChart",
            group: label,
            label: [],
            datasets: {backgroundColor: [], data: []},
            target: dataset.target ? dataset.target : "",
            cgid: dataset.cgid,
            id: dataset.id,
            source: dataset.source
        };

        dataset.data.datasets.forEach((set) => {
            const labelScope = set.label,
                labelVal = set.data[i];

            obj.label.push(labelScope);
            obj.datasets.backgroundColor.push(set.backgroundColor);
            obj.datasets.data.push(labelVal);
        });

        newPieChartData.push(obj);
    });

    return newPieChartData;
}
