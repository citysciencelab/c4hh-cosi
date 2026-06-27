import apiEndpointService from "../../apiEndpointService.js";

const actions = {
    /**
     * Get all data by genders
     * @param {Object} state the store's state and commit object.
     * @param {Function} commit Commit Object
     * @returns {Promise<void>} sets the data in store
     **/
    getGendersData: async ({state, commit}) => {
        commit("setLoader", true);

        const
            responses = await apiEndpointService.receiveGenders([state.selectedLocationId]);

        commit("setGendersData", responses[0]);
        commit("setGendersMonthlyData");
        commit("setLoader", false);
    }
};

export default actions;
