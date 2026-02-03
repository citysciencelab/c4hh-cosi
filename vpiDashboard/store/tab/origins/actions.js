import apiEndpointService from "../../apiEndpointService.js";

const actions = {
    /**
     * Addresses the tgl_besucher_nach_landkr endpoint to get the data for the complete time range
     * @param {Object} state the stores state object.
     * @param {Function} commit actions commit object.
     * @returns {void}
     **/
    getOriginsCities: async ({state, commit}) => {
        commit("setLoader", true);

        const responses = await apiEndpointService.receiveOriginsCities([state.selectedLocationId]);

        commit("setAllOriginsData", responses[0]);
        commit("setAllOriginsMonthlyData", responses[0]);
        commit("setAverageVisitorsPerWeek", responses[0]);
        commit("setLoader", false);
    }
};

export default actions;
