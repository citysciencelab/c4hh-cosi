import isObject from "@shared/js/utils/isObject.js";

/**
 * Gets the categories grouped or ungrouped.
 * @param {Object} statisticsAttributes - The configured statistics attributes.
 * @returns {Object} The categeories.
 */
function getCategoriesFromStatisticAttributes (statisticsAttributes) {
    if (!isObject(statisticsAttributes)) {
        return [];
    }

    return getUngroupedCategories(statisticsAttributes);
}

/**
 * Gets all categories ungrouped.
 * @param {Object} statistics - The configured statistics.
 * @returns {Object[]} The categories.
 */
function getUngroupedCategories (statistics) {
    const categories = [];

    Object.values(statistics).forEach(statistic => {
        if (!categories.find(category => category.name === statistic.category)) {
            categories.push({
                name: statistic.category
            });
        }
    });

    return categories;
}

/**
 * Gets all statistics of a category.
 * @param {String} categoryName - The name of the category.
 * @param {Object} statistics - The configured statistics.
 * @returns {Object} The statistics by the given category.
 */
function getStatisticsByCategory (categoryName, statistics) {
    const statsByCategory = {};

    Object.keys(statistics).forEach(key => {
        if (statistics[key].category === categoryName) {
            statsByCategory[key] = statistics[key];
        }
    });

    return statsByCategory;
}

/**
 * Gets the keys of the statistics included in the given names.
 * @param {Object} statistics - The configured statistics.
 * @param {String[]} statisticsNames - The names of the statistics.
 * @returns {String[]} The names(keys) of the statistic attributes.
 */
function getStatsKeysByName (statistics, statisticsNames) {
    if (!Array.isArray(statistics) || !Array.isArray(statisticsNames)) {
        return [];
    }
    const statsKeys = [];

    statistics.forEach(statistic => {
        Object.entries(statistic).forEach(([key, stat]) => {
            if (statisticsNames.includes(stat.name)) {
                statsKeys.push(key);
            }
        });
    });

    return statsKeys;
}

export default {
    getCategoriesFromStatisticAttributes,
    getStatisticsByCategory,
    getUngroupedCategories,
    getStatsKeysByName
};
