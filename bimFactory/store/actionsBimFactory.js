import axios from "axios";

export default {

    async loadWorkflows ({state, commit}) {
        if (state.workflowsJSONPath.length !== 0) {
            const response = await axios.get(state.workflowsJSONPath);

            commit("setWorkflowsJSON", response.data);
        }
    }
};
