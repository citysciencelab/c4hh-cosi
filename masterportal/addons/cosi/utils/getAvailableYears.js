/**
 * Gets all available Years from array of features.
 * @param {module:ol/Feature[] | Object[]} features Array Of Features or properties of features.
 * @param {String} [year_selector="jahr_"] The identifier for year data (usually "jahr_").
 * @returns {String[]} The Array of all available Years in the data set.
 */
export default function getAvailableYears (features, year_selector = "jahr_") {
    const availableYears = [];

    features.forEach(feature => {
        const properties = feature.getProperties ? feature.getProperties() : feature;

        Object.keys(properties).forEach(key => {
            if (key.includes(year_selector)) {
                availableYears.push(key.replace(year_selector, ""));
            }
        });
    });

    return [...new Set(availableYears)].sort().reverse();
}

/**
 * Gets all available Years from array of features.
 * @param {Object[]} features Array Of Features.
 * @param {String} [year_selector="jahr_"] The identifier for year data (usually "jahr_").
 * @returns {String[]} The Array of all available Years in the data set.
 */
export function getLastAvailableYear (features, year_selector = "jahr_") {
    const yearsMatrix = features.map(feature => Object.keys(feature.getProperties())
        .map(key => parseInt(key.replace(year_selector, ""), 10))
        .filter(year => !isNaN(year))
        .sort((a, b) => b - a)
    );

    for (let i = 0; i < yearsMatrix.length; i++) {
        for (let j = 0; j < yearsMatrix[i].length; j++) {
            const year = yearsMatrix[i][j];

            if (yearsMatrix.every(years => years.includes(year))) {
                return year;
            }
        }
    }

    return getAvailableYears(features, year_selector)[0];
}
