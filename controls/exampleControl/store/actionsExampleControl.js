const actions = {

    /**
     * Dispatches single warning alert.
     *
     * @param {String} content String or locale key to show.
     * @returns {void}
     */
    showAlert ({dispatch}, content) {
        dispatch(
            "Alerting/addSingleAlert", {
                title: "Alarm",
                category: "warning",
                content: i18next.t(content)
            }, {root: true});
    }
};

export default actions;
