import {scaleLinear} from "d3-scale";
import {hsl} from "d3-color";
import {interpolateRainbow} from "d3-scale-chromatic";

/**
 * @description Generates colorScale for the amount of datasets in the data property of the dataset to be generated.
 * @param {Object} dataset dataset containing the data to be rendered as graph.
 * @returns {Array} ColorScale Array.
 */
export default function generateColorScale (dataset) {

    if (Array.isArray(dataset.color)) {
        const domainRange = [0];

        dataset.color.map(incColor => hsl(incColor));
        dataset.color.forEach((incColor, index) => {
            if (index < (dataset.color.length - 2)) {
                domainRange.push(dataset.data.datasets.length / (index + 2));
            }
        });

        domainRange.push(dataset.data.datasets.length);
        domainRange.sort();
        return scaleLinear().domain(domainRange).range(dataset.color);
    }
    else if (dataset.color === "rainbow") {
        const range = [],
            domainRange = [];

        dataset.data.datasets.forEach((set, index) => {
            domainRange.push(index);
        });

        dataset.data.datasets.forEach((set, index) => {
            const indexValue = (index + 1) / dataset.data.datasets.length,
                rainbowColor = interpolateRainbow(indexValue).toString();

            range.push(rainbowColor);
        });

        return scaleLinear().domain(domainRange).range(range);
    }

    const d3Color = hsl(dataset.color);
    let colorA = "",
        colorB = "",
        range = "";

    d3Color.h += 20;
    d3Color.s += 0.3;
    d3Color.l += 0.15;

    colorA = String(d3Color);

    d3Color.h -= 40;
    d3Color.s -= 0.6;
    d3Color.l -= 0.3;

    colorB = String(d3Color);

    range = [colorA, String(d3Color), colorB];

    return scaleLinear().domain([0, dataset.data.datasets.length]).range(range);
}

