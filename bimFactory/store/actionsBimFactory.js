import axios from "axios";

export default {

    async loadWorkflows ({state, commit}) {
        if (state.workflowsJSONPath.length !== 0) {
            const response = await axios.get(state.workflowsJSONPath);

            if (response && response.data) {
                commit("setWorkflowsJSON", response.data);
            }
        }
    },
    async loadSingleWorkflow ({state, getters}, workflowId) {
        if (getters.getWorkflowDetailsForId(workflowId) === null) {

            const path = getters.getWorkflowForId(workflowId)?.config;

            if (path && path.length !== 0) {
                const response = await axios.get(path);

                if (response && response.data) {
                    state.workflowsDetails.push(response.data);
                }
            }
        }
    },
    /**
     * Filter requests based on the provided bounding box and endpoint.
     * Sends a request to the specified endpoint with bounding box parameters
     * and commits the filtered data to the store.
     *
     * @param {Object} context - The Vuex context object.
     * @param {Function} context.commit - The Vuex commit function.
     * @param {Object} payload - The payload containing filtering parameters.
     * @param {string} payload.endpoint - The endpoint URL to send the request to.
     * @param {Array<number>} payload.bboxLowerLeftCorner - The lower-left corner of the bounding box [x, y].
     * @param {Array<number>} payload.bboxUpperRightCorner - The upper-right corner of the bounding box [x, y].
     * @returns {void}
     */
    async filterRequests ({commit}, payload) {
        commit("setIsLoading", true);

        const params = new URLSearchParams({
                min_x: payload.bboxLowerLeftCorner[0],
                min_y: payload.bboxLowerLeftCorner[1],
                max_x: payload.bboxUpperRightCorner[0],
                max_y: payload.bboxUpperRightCorner[1]
            }),
            requestUrl = `${payload.endpoint}?${params.toString()}`,
            response = await axios.get(requestUrl, {
                headers: {
                    "Content-Type": "application/json"
                }
            });

        if (response && response.data) {
            commit("setFilteredData", response.data);
            commit("setIsLoading", false);
        }
    }
};
