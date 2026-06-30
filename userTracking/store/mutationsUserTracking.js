import {getBaseUrl} from "../js/util";

const mutations = {
    /**
     * Appends a new page entry to the history of the given menu side.
     * @param {Object} state The store state.
     * @param {Object} payload The mutation payload.
     * @param {String} payload.side The menu side (mainMenu or secondaryMenu).
     * @param {String} payload.title The page title to push.
     * @param {String} payload.url The URL to push.
     * @returns {void}
     */
    addPageToHistory (state, {side, title, url}) {
        state.history[side].page.push({title, url});
    },

    /**
     * Removes the last page entry from the history of the given menu side.
     * @param {Object} state The store state.
     * @param {Object} payload The mutation payload.
     * @param {String} payload.side The menu side (mainMenu or secondaryMenu).
     * @returns {void}
     */
    removeLastPageFromHistory (state, {side}) {
        state.history[side].page.pop();
    },

    /**
     * Resets the page history for the given menu side to the current page.
     * @param {Object} state The store state.
     * @param {Object} payload The mutation payload.
     * @param {String} payload.side The menu side (mainMenu or secondaryMenu).
     * @returns {void}
     */
    resetPageHistory (state, {side}) {
        state.history[side].page = [{title: document.title, url: `${getBaseUrl()}${side}`}];
    },

    /**
     * Sets the timeout id used to debounce search bar input tracking.
     * @param {Object} state The store state.
     * @param {?Number} timeoutId The timeout id to store, or null to clear it.
     * @returns {void}
     */
    setSearchBarInputTimeoutId (state, timeoutId) {
        state.searchBarInputTimeoutId = timeoutId;
    }
};

export default mutations;
