import {rgb} from "d3-color";

/**
 * fixes color as object to rgb
 * @param {ChartDataset} chartData - the chart config
 * @returns {Object} the original data
 */
export default function fixColor (chartData) {
    if (chartData.data) {
        for (const dataset of chartData.data.datasets) {
            if (typeof dataset.backgroundColor === "object" && !(dataset.backgroundColor instanceof rgb)) {
                dataset.backgroundColor = rgb(
                    dataset.backgroundColor.r,
                    dataset.backgroundColor.g,
                    dataset.backgroundColor.g,
                    dataset.backgroundColor.opacity
                );
            }
            if (typeof dataset.borderColor === "object" && !(dataset.borderColor instanceof rgb)) {
                dataset.borderColor = rgb(
                    dataset.borderColor.r,
                    dataset.borderColor.g,
                    dataset.borderColor.g,
                    dataset.borderColor.opacity
                );
            }
        }
    }

    return chartData;
}
