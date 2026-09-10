const actions = {
    /**
     * Clears the timeout used to debounce search bar input tracking, if one is set.
     * @param {Object} context The vuex action context.
     * @param {Object} context.getters The store getters.
     * @param {Function} context.commit The commit function.
     * @returns {void}
     */
    forceClearSearchBarTimeout ({getters, commit}) {
        const searchBarInputTimeoutId = getters.getSearchBarInputTimeoutId;

        if (searchBarInputTimeoutId !== null) {
            clearTimeout(searchBarInputTimeoutId);
            commit("setSearchBarInputTimeoutId", null);
        }
    }
};

export default actions;
