import {changeDateFormat} from "./dateHelpers.js";

/**
 * Aggregates visitor data by date and rounds the values up to the nearest 100.
 * @param {Array} data - An array of data objects, where each object contains a `properties` field with `datum` (date) and `besucher` (visitor count).
 * @returns {Object} An object where the keys are formatted dates and the values are the aggregated and rounded visitor counts.
 */
export default function (data) {
    const aggregated = {};

    if (data && Array.isArray(data)) {
        data.forEach(feature => {
            const item = feature.properties,
                label = changeDateFormat(new Date(item.datum));

            if (!aggregated[label]) {
                aggregated[label] = 0;
            }
            aggregated[label] += item.besucher;
        });
    }
    else {
        console.warn("Invalid data:", data);
    }

    // Ceil up to 100, e.g. 18318 becomes 18400
    Object.keys(aggregated).forEach(key => {
        aggregated[key] = Math.ceil(aggregated[key] / 100) * 100;
    });

    return aggregated;
}
