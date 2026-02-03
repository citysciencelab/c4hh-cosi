import {generateSimpleMutations} from "../../../src/shared/js/utils/generators.js";
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
    },
    /**
     * Adds an error to a specific component in the workflowsDetails structure.
     * @param {Object} state - The Vuex state object.
     * @param {Object} payload - Contains all indices and the errorItem.
     * @param {number} payload.workflowIdx
     * @param {number} payload.stepIdx
     * @param {number} payload.sectionIdx
     * @param {number} payload.containerIdx
     * @param {number} payload.componentIdx
     * @param {Object} payload.errorItem
     */
    addErrorToComponent (state, {workflowIdx, stepIdx, sectionIdx, containerIdx, componentIdx, errorItem}) {
        const component = state.workflowsDetails[workflowIdx]
            .steps[stepIdx]
            .sections[sectionIdx]
            .containers[containerIdx]
            .components[componentIdx];

        component.errors = [];
        component.errors.push(errorItem);
    },
    /**
     * Clears errors in components..
     * - no params: all errors to reset.
     * - With containerId and machineName: Just this error to be removed.
     * @param {Object} state - Der Vuex-Status.
     * @param {Object} payload - Optional: {containerId:string, machineName:string, emptyError:boolean}
     * @param {Boolean} payload.emptyError - Cleans the error string to be invisible after changing a form value
     */
    clearComponentErrors (state, payload = {}) {
        const {containerId, machineName, emptyError} = payload;

        state.workflowsDetails.forEach(workflow => {
            if (!workflow.steps) {
                return;
            }

            workflow.steps.forEach(step => {
                if (!step.sections) {
                    return;
                }

                step.sections.forEach(section => {
                    if (!section.containers) {
                        return;
                    }

                    section.containers.forEach(container => {
                        if (!container.components) {
                            return;
                        }

                        container.components.forEach(component => {
                            const match = !containerId || (
                                container.containerId === containerId &&
                                component.machineName === machineName
                            );

                            if (match && Array.isArray(component.errors)) {
                                if (emptyError) {
                                    component.errors = [{"msg": ""}];
                                }
                                else {
                                    component.errors = [];
                                }
                            }
                        });
                    });
                });
            });
        });
    }
};

export default mutations;
