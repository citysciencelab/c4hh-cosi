import {generateSimpleMutations} from "@shared/js/utils/generators.js";
import stateDistrictSelector from "./stateDistrictSelector";

const mutations = {
    /**
     * Creates from every state-key a setter.
     * For example, given a state object {key: value}, an object
     * {setKey:   (state, payload) => *   state[key] = payload * }
     * will be returned.
     */
    ...generateSimpleMutations(stateDistrictSelector),

    /**
     * Sets the statistical data cards.
     * @param {Object} state - The DistrictSelector store state.
     * @param {Object[]} payload - The statistical data cards.
     * @returns {void}
     */
    setSelectionCardsStatisticalData (state, payload) {
        state.selectionCardsStatisticalData = payload;
    },

    /**
     * Sets the subject data cards.
     * @param {Object} state - The DistrictSelector store state.
     * @param {Object[]} payload - The subject data cards.
     * @returns {void}
     */
    setSelectionCardsSubjectData (state, payload) {
        state.selectionCardsSubjectData = payload;
    },

    /**
     * Sets the selected tab item.
     * @param {Object} state - The DistrictSelector store state.
     * @param {Object} payload - The selected tab item.
     * @returns {void}
     */
    setSelectedTabItem (state, payload) {
        state.selectedTabItem = payload;
    },

    /**
     * Adds a new statistical category to the mapping
     * @param {Object} state - the DistrictSelector store state
     * @param {String} category - the new category
     * @param {String} group - the group the category belongs to
     * @param {String} [valueType="relative"] - absolute or relative
     * @param {String} [isTemp=true] - whether created on runtime
     * @returns {void}
     */
    addCategoryToMapping (state, {category, group, valueType = "relative", isTemp = true, calculation = undefined}) {
        const mappingObject = state.mapping.find(el => el.value === category && el.group === group);

        if (!mappingObject) {
            state.mapping.push({
                category: category,
                value: category,
                group: group,
                valueType: valueType,
                isTemp: isTemp,
                calculation: calculation,
                ...Object.fromEntries(state.districtLevels.map(districtLevel => [districtLevel.stats.keyOfAttrName, true]))
            });
        }
    },

    /**
     * Removes a new statistical category to the mapping
     * @param {Object} state - the DistrictSelector store state
     * @param {String} category - the new category
     * @param {String} group - the group the category belongs to
     * @returns {void}
     */
    removeCategoryFromMapping (state, {category, group}) {
        state.mapping = state.mapping.filter(el => !(el.value === category && el.group === group));
    },

    addRemoteMetadata (state, {layerId, metadata}) {
        state.remoteMetadata[layerId] = metadata;
    }
};

export default mutations;
