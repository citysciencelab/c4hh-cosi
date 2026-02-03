import apiEndpointService from "../../apiEndpointService.js";

const actions = {
    /**
     * Get all data by age group
     * @param {Object} state the store's state and commit object.
     * @param {Function} commit Commit Object
     * @returns {Promise<void>} sets the data in store
     */
    getAllAgeGroupsData: async ({state, commit}) => {
        commit("setLoader", true);

        const
            responses = await apiEndpointService.receiveAgeGroups([state.selectedLocationId]);

        commit("setAllAgeGroupsData", responses[0]);
        commit("setAllAgeGroupsMonthlyData");
        commit("setLoader", false);
    }
};

export default actions;
