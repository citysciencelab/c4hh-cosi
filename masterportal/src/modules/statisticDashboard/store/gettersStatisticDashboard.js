/** @import { SelectedStatistics } from "../types/internalTypes.js" */
/** @import { StatisticDashboardLevel } from "../types/typesStatisticDashboard" */
/** @import { StatisticDashboardState } from "../store/stateStatisticDashboard.js" */
import {generateSimpleGetters} from "@shared/js/utils/generators.js";
import isObject from "@shared/js/utils/isObject.js";
import initialState from "./stateStatisticDashboard.js";
import sortBy from "@shared/js/utils/sortBy.js";

const getters = {
    ...generateSimpleGetters(initialState),

    /**
     * Gets the selected level from the configured levels by its name.
     * @param {StatisticDashboardState} state - The StatisticDashboard state.
     * @returns {StatisticDashboardLevel|undefined} The matching level or undefined.
     */
    selectedLevel: state => state.data.find(level => level.levelName === state.selectedLevelName),

    /**
     * Gets the available categories from the selected level
     * @param {StatisticDashboardState} state - The StatisticDashboard state.
     * @param {object} getters
     * @param {StatisticDashboardLevel|undefined} getters.selectedLevel
     * @returns {string[]} The available categories.
     */
    categories (state, {selectedLevel}) {
        if (!selectedLevel) {
            return [];
        }
        const categories = new Set();

        for (const attribute of Object.values(selectedLevel.mappingFilter.statisticsAttributes)) {
            categories.add(attribute.category);
        }
        return [...categories];
    },

    /**
     * Gets the an object containing the selectedStatistics
     * @param {StatisticDashboardState} state - The StatisticDashboard state.
     * @param {object} getters
     * @param {StatisticDashboardLevel|undefined} getters.selectedLevel The selected level.
     * @returns {SelectedStatistics} An object containing the selected statistics.
     */
    selectedStatistics (state, {selectedLevel}) {
        if (!selectedLevel) {
            return {};
        }
        return Object.fromEntries(
            Object.entries(selectedLevel.mappingFilter.statisticsAttributes)
                .filter(([key]) => state.selectedStatisticsKeys.includes(key))
                .map(([key, value]) => [key, {
                    ...value,
                    key,
                    selectedOrder: state.selectedStatisticsKeys.findIndex(e => e === key)
                }])
        );
    },

    /**
     * Gets the values of the selected dates.
     * @param {Object} state - The StatisticDashboard state.
     * @param {Object} getters - The StatisticDashboard getters.
     * @param {Object[]} getters.selectedDates - The selected dates.
     * @return {String[]} The values of the selected dates.
     */
    selectedDatesValues (state, {selectedDates}) {
        const datesValues = [];

        selectedDates.forEach(date => {
            if (!isObject(date)) {
                return;
            }
            if (Array.isArray(date.value)) {
                datesValues.push(...date.value);
            }
            else {
                datesValues.push(date.value);
            }
        });

        return datesValues;
    },

    /**
     * Gets the values of the selected regions.
     * @param {Object} state - The StatisticDashboard state.
     * @param {Object} getters - The StatisticDashboard getters.
     * @param {Object[]} getters.selectedRegions - The selected regions.
     * @returns {String[]} The values(names) of the selected regions.
     */
    selectedRegionsValues (state, {selectedRegions}) {
        if (!Array.isArray(selectedRegions)) {
            return [];
        }

        const allValues = state?.flattenedRegions?.find(region => !Object.prototype.hasOwnProperty.call(region, "child"))?.values;
        let regions = selectedRegions;

        if (Array.isArray(allValues) && allValues.length > 0 && selectedRegions.length === allValues.length) {
            regions = sortBy(allValues, "title");
        }

        const mappedRegionsValues = regions.map(region => region.value),
            allRegions = mappedRegionsValues.find(region => Array.isArray(region));

        return typeof allRegions !== "undefined" ? allRegions : mappedRegionsValues;
    },

    /**
     * Checks whether the selected level has at least one statistic with specifics.
     * @param {StatisticDashboardState} state - The StatisticDashboard state.
     * @param {object} getters
     * @param {StatisticDashboardLevel|undefined} getters.selectedLevel The selected level.
     * @returns {Boolean} True if any statistic of the selected level has specifics.
     */
    hasSpecifics (state, {selectedLevel}) {
        return Object.values(selectedLevel?.mappingFilter.statisticsAttributes ?? {})
            .some(attribute => Object.keys(attribute.specifics ?? {}).length > 0);
    },

    /**
     * Gets the keys of all statistics referenced as specifics in the selected level.
     * @param {StatisticDashboardState} state - The StatisticDashboard state.
     * @param {object} getters
     * @param {StatisticDashboardLevel|undefined} getters.selectedLevel The selected level.
     * @returns {string[]} The specific statistic keys.
     */
    specificStatisticKeys (state, {selectedLevel}) {
        if (!selectedLevel) {
            return [];
        }
        /** @type {Set<string>} */
        const keys = new Set();

        for (const attribute of Object.values(selectedLevel.mappingFilter.statisticsAttributes)) {
            if (!attribute.specifics) {
                continue;
            }
            for (const specificKeys of Object.values(attribute.specifics)) {
                for (const key of specificKeys) {
                    keys.add(key);
                }
            }
        }
        return [...keys];
    },

    /**
     * Gets the selected statistics that are not specific statistics.
     * @param {StatisticDashboardState} state - The StatisticDashboard state.
     * @param {object} getters
     * @param {SelectedStatistics} getters.selectedStatistics The selected statistics.
     * @param {string[]} getters.specificStatisticKeys The specific statistic keys.
     * @returns {SelectedStatistics} The selected aggregated statistics.
     */
    aggregatedStatistics (state, {selectedStatistics, specificStatisticKeys}) {
        return Object.fromEntries(
            Object.entries(selectedStatistics).filter(([key]) => !specificStatisticKeys.includes(key))
        );
    }
};

export default getters;
