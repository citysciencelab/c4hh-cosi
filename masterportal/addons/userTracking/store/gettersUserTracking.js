const getters = {
    /**
     * Returns a function that retrieves the current (latest) page entry
     * for the given menu side.
     * @param {Object} state The store state.
     * @returns {Function} A function accepting a side string and returning the latest page entry.
     */
    getCurrentPage: (state) => (side) => {
        const {page} = state.history[side];

        return page[page.length - 1];
    },

    /**
     * Returns a function that retrieves the current number of page entries
     * for the given menu side. Used to synchronize the tracking history depth
     * with the Menu store's navigation history depth.
     * @param {Object} state The store state.
     * @returns {Function} A function accepting a side string and returning the page history length.
     */
    getPageHistoryLength: (state) => (side) => {
        return state.history[side].page.length;
    },

    /**
     * Returns the timeout id used to debounce search bar input tracking.
     * @param {Object} state The store state.
     * @returns {?Number} The current timeout id, or null if none is set.
     */
    getSearchBarInputTimeoutId: (state) => {
        return state.searchBarInputTimeoutId;
    }
};

export default getters;
