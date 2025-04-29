import {generateSimpleMutations} from "../../../src/shared/js/utils/generators";
import stateBimFactory from "./stateBimFactory.js";

const mutations = {
    /**
     * Creates from every state-key a setter.
     * For example, given a state object {key: value}, an object
     * {setKey:   (state, payload) => *   state[key] = payload * }
     * will be returned.
     */
    ...generateSimpleMutations(stateBimFactory),
    /**
     * Initializes the workflow form data with the provided formData.
     *
     * @param {Object} state - The Vuex state object.
     * @param {Object} formData - The form data to initialize the workflow with.
     */
    initializeWorkflowFormData (state, formData) {
        state.workflowFormData = formData;
    },
    /**
     * Updates the workflow form data by modifying the value of a specific component
     * within a container, identified by its containerId and component title.
     *
     * @param {Object} state - The Vuex state object.
     * @param {string} containerId - The ID of the container to update.
     * @param {string} title - The title of the component to update within the container.
     * @param {string} value - The new value to assign to the specified component.
     */
    updateWorkflowFormData (state, {containerId, machineName, value}) {
        state.workflowFormData.containers.forEach(container => {
            if (container.containerId === containerId && container.components[machineName]) {
                container.components[machineName].value = value;
            }
        });
    },
    /**
     * Sets the bounding box (bbox) in the workflow form data.
     *
     * @param {Object} state - The current state of the store.
     * @param {Object} bbox - Object containing the bounding box coordinates.
     */
    setWorkflowFormDataBbox (state, bbox) {
        state.workflowFormData.bbox = bbox;
    }
};

export default mutations;
