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
    }
};
