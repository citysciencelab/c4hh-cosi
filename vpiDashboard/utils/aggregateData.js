/**
 * Generic function to aggregate data by a specified time unit (e.g., week, month).
 * @param {Array} data - The input data array.
 * @param {Function} dateExtractor - Function to extract the year from a date.
 * @param {Function} timeUnitExtractor - Function to extract the time unit (e.g., week or month) from a date.
 * @param {Function} aggregator - Function to initialize the aggregation object.
 * @param {String|null} groupBy - Optional property to group data by.
 * @returns {Object} - Aggregated data.
 */
export default function (
    data,
    dateExtractor,
    timeUnitExtractor,
    aggregator,
    groupBy = null
) {
    const aggregated = {};

    if (data && Array.isArray(data)) {
        data.forEach(feature => {
            const item = feature.properties,
                date = new Date(item.datum),
                timeUnit = timeUnitExtractor(date),
                year = dateExtractor(date),
                group = groupBy ? item[groupBy] : null;

            if (!aggregated[year]) {
                aggregated[year] = {};
            }

            if (!aggregated[year][timeUnit]) {
                aggregated[year][timeUnit] = group ? {} : aggregator();
            }

            if (group && !aggregated[year][timeUnit][group]) {
                aggregated[year][timeUnit][group] = aggregator();
            }

            if (group) {
                aggregated[year][timeUnit][group].sum += item.besucher;
                aggregated[year][timeUnit][group].count++;
            }
            else {
                aggregated[year][timeUnit].sum += item.besucher;
                aggregated[year][timeUnit].count++;
            }

        });
    }
    else {
        console.warn("Invalid data:", data);
    }

    return aggregated;
}
