/**
 * @todo Keep Generic and adjust to data structure to be served by DistrictSelector
 */

/**
 * @description reads out the available timestamps from a given dataset
 * @param {Object[] | Object} data - the dataset to check
 * @param {String} [timestampPrefix="jahr_"] - the prefix of the keys signifying timestamps.
 * @param {Boolean} [ascending=false] - return list in ascending order, default is decending
 * @returns {number[]} the available timestamps
 */
export function getTimestamps (data, timestampPrefix = "jahr_", ascending = false) {
    if (!data || typeof data !== "object") {
        console.error(`getTimestamps: ${data} has to be defined and an object or an array of objects.`);
        return [];
    }

    const _data = Array.isArray(data) ? data : [data],
        timestamps = _data.reduce((range, datum) => {
            for (const key in datum) {
                if (datum[key]?.constructor === Object) {
                    for (const prop in datum[key]) {
                        const timestamp = parseInt(prop.replace(timestampPrefix, ""), 10);

                        if (!isNaN(timestamp) && !range.includes(timestamp)) {
                            range.push(timestamp);
                        }
                    }
                }
            }
            return range;
        }, []);

    return ascending ? timestamps.sort() : timestamps.sort().reverse();
}

/**
 * @description reads out the range of available timestamps from a given dataset
 * @param {Object[] | Object} data - the dataset to check
 * @param {String} [timestampPrefix="jahr_"] - the prefix of the keys signifying timestamps.
 * @returns {number[]} the range of timestamps
 */
export function getTimestampRange (data, timestampPrefix = "jahr_") {
    if (!data || typeof data !== "object") {
        console.error(`getTimestampRange: ${data} has to be defined and an object or an array of objects.`);
        return [];
    }
    const _data = Array.isArray(data) ? data : [data],
        timestamps = _data.map(datum => {
            return Object.values(datum).map(el => {
                return Object.entries(el).filter(key => !isNaN(parseInt(key.replace(timestampPrefix, ""), 10)));
            });
        }).flat();

    return [Math.min(timestamps), Math.max(timestamps)];
}

export default {
    getTimestamps,
    getTimestampRange
};

