// @ts-check

/** @import { StatisticDashboardState } from "../store/stateStatisticDashboard.js" */
/** @import { StatisticDashboardLevel } from "../types/typesStatisticDashboard" */
import {generateSimpleMutations} from "@shared/js/utils/generators.js";
import initialState from "./stateStatisticDashboard.js";

/**
 * Gets the currently selected level.
 * @param {StatisticDashboardState} state The state.
 * @returns {StatisticDashboardLevel|undefined} The selected level.
 */
function getSelectedLevel (state) {
    return state.data.find(({levelName}) => levelName === state.selectedLevelName);
}

/**
 * Gets the defined specific statistic keys of the given tags of an aggregated statistic.
 * @param {Object<string, any>} attributes The statistics attributes.
 * @param {string} statisticKey The key of the aggregated statistic.
 * @param {string[]} tags The tags.
 * @returns {string[]} The specific statistic keys.
 */
function getTagKeys (attributes, statisticKey, tags) {
    return tags
        .flatMap(tag => attributes[statisticKey]?.specifics?.[tag] ?? [])
        .filter(key => key in attributes);
}

/**
 * Gets the specific statistic keys covered by the currently selected tags.
 * @param {StatisticDashboardState} state The state.
 * @param {Object<string, any>} attributes The statistics attributes.
 * @returns {string[]} The covered keys.
 */
function getCoveredKeys (state, attributes) {
    return Object.entries(state.selectedSpecificsTags)
        .flatMap(([key, tags]) => getTagKeys(attributes, key, tags));
}

/**
 * Gets all keys referenced as specifics in the given statistics attributes.
 * @param {Object<string, any>} attributes The statistics attributes.
 * @returns {string[]} The specific statistic keys.
 */
function getSpecificKeys (attributes) {
    return Object.values(attributes).flatMap(attribute => Object.values(attribute.specifics ?? {}).flat());
}

/**
 * Removes aggregated statistics together with their tags and the specific statistics only they cover.
 * @param {StatisticDashboardState} state The state.
 * @param {Object<string, any>} attributes The statistics attributes.
 * @param {string[]} removedKeys The keys of the aggregated statistics to remove.
 * @returns {void}
 */
function removeAggregatedStatistics (state, attributes, removedKeys) {
    const orphanCandidates = removedKeys.flatMap(key => getTagKeys(attributes, key, state.selectedSpecificsTags[key] ?? []));

    removedKeys.forEach(key => {
        delete state.selectedSpecificsTags[key];
    });

    const coveredKeys = getCoveredKeys(state, attributes);

    state.selectedStatisticsKeys = state.selectedStatisticsKeys.filter(key => {
        return !removedKeys.includes(key) && (!orphanCandidates.includes(key) || coveredKeys.includes(key));
    });
}

const mutations = {
    ...generateSimpleMutations(initialState),

    /**
     * Updates the selected categories, and statistics if necessary.
     * If showAggregatedView is enabled, specific statistics are kept as long as their aggregated statistic is kept.
     * @param {StatisticDashboardState} state The state
     * @param {string[]} selectedCategories Payload - the new categories
     */
    updateSelectedCategories (state, selectedCategories) {
        const level = getSelectedLevel(state);

        if (!level) {
            return;
        }

        const {statisticsAttributes} = level.mappingFilter,
            specificKeys = state.showAggregatedView ? getSpecificKeys(statisticsAttributes) : [],
            removedKeys = state.selectedStatisticsKeys.filter(key => {
                return !specificKeys.includes(key) && !selectedCategories.includes(statisticsAttributes[key]?.category);
            });

        state.selectedCategories = selectedCategories;
        removeAggregatedStatistics(state, statisticsAttributes, removedKeys);
    },

    /**
     * Sets the selected aggregated statistics. Selected specific statistics are kept as long as they are still covered.
     * The order of already selected statistics is preserved, new ones are appended.
     * @param {StatisticDashboardState} state The state
     * @param {string[]} aggregatedKeys Payload - the keys of the selected aggregated statistics
     */
    setSelectedAggregatedStatisticsKeys (state, aggregatedKeys) {
        const level = getSelectedLevel(state);

        if (!level) {
            return;
        }

        const {statisticsAttributes} = level.mappingFilter,
            specificKeys = getSpecificKeys(statisticsAttributes),
            selectedAggregated = state.selectedStatisticsKeys.filter(key => !specificKeys.includes(key)),
            addedKeys = aggregatedKeys.filter(key => !selectedAggregated.includes(key)),
            removedKeys = selectedAggregated.filter(key => !aggregatedKeys.includes(key));

        state.selectedStatisticsKeys = [...state.selectedStatisticsKeys, ...addedKeys];
        removeAggregatedStatistics(state, statisticsAttributes, removedKeys);
    },

    /**
     * Toggles a tag of an aggregated statistic.
     * Activating adds all specific statistics of the tag, deactivating removes those not covered by another active tag.
     * @param {StatisticDashboardState} state The state
     * @param {Object} payload Payload
     * @param {string} payload.statisticKey The key of the aggregated statistic.
     * @param {string} payload.tag The tag to toggle.
     */
    toggleSpecificsTag (state, {statisticKey, tag}) {
        const level = getSelectedLevel(state);

        if (!level) {
            return;
        }

        const {statisticsAttributes} = level.mappingFilter,
            tags = state.selectedSpecificsTags[statisticKey] ?? [],
            tagKeys = getTagKeys(statisticsAttributes, statisticKey, [tag]);

        if (!tags.includes(tag)) {
            state.selectedSpecificsTags[statisticKey] = [...tags, tag];
            state.selectedStatisticsKeys = [...new Set([...state.selectedStatisticsKeys, ...tagKeys])];
            return;
        }

        const remainingTags = tags.filter(selectedTag => selectedTag !== tag);

        if (remainingTags.length > 0) {
            state.selectedSpecificsTags[statisticKey] = remainingTags;
        }
        else {
            delete state.selectedSpecificsTags[statisticKey];
        }

        const coveredKeys = getCoveredKeys(state, statisticsAttributes);

        state.selectedStatisticsKeys = state.selectedStatisticsKeys
            .filter(key => !tagKeys.includes(key) || coveredKeys.includes(key));
    },

    /**
     * Removes a single selected specific statistic. The active tags stay unchanged.
     * @param {StatisticDashboardState} state The state
     * @param {string} key Payload - the key of the specific statistic
     */
    removeSpecificStatistic (state, key) {
        state.selectedStatisticsKeys = state.selectedStatisticsKeys.filter(selectedKey => selectedKey !== key);
    }
};

export default mutations;
