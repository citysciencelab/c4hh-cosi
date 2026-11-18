/** @import { StatisticDashboardLevel } from "../types/typesStatisticDashboard" */

/**
 * Warns on the console about every key referenced in `specifics` that is not defined in the statistics attributes.
 * @param {StatisticDashboardLevel[]} levels The configured levels.
 * @returns {void}
 */
export default function warnMissingSpecifics (levels) {
    levels.forEach(({levelName, mappingFilter}) => {
        const attributes = mappingFilter.statisticsAttributes;

        Object.entries(attributes).forEach(([statisticKey, attribute]) => {
            Object.entries(attribute.specifics ?? {}).forEach(([tag, specificKeys]) => {
                specificKeys
                    .filter(specificKey => !(specificKey in attributes))
                    .forEach(specificKey => {
                        console.warn(`Statistic dashboard: specific statistic "${specificKey}" (tag "${tag}" of "${statisticKey}", level "${levelName}") is not defined in statisticsAttributes and will be ignored.`);
                    });
            });
        });
    });
}
