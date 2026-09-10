const actions = {
    /**
     * Restores the storyPlayer state from URL parameters.
     * Called by the menu store when the portal is opened with a shared URL.
     * @param {Object} param.commit the commit function
     * @param {Object} attributes The URL attributes containing the story name to restore.
     * @returns {void}
     */
    urlParams ({commit}, attributes) {
        if (attributes?.currentStoryName) {
            commit("setCurrentStoryName", attributes.currentStoryName);
        }
    }
};

export default actions;
