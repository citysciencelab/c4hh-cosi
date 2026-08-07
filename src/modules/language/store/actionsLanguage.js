const actions = {
    /**
     * Changes the currently active locale.
     * @param {Object} context the vuex context
     * @param {Function} context.commit the commit function
     * @param {Object} payload the payload
     * @param {String} payload.language The language/locale to switch to.
     * @param {Boolean} [payload.doNotTrack] If true, the language change is not tracked.
     * @param {String} [payload._source] The source component that triggered the action; included in the tracking event.
     * @returns {void}
     */
    changeLocale ({commit}, payload) {
        commit("setCurrentLocale", payload.language);
    }
};

export default actions;
