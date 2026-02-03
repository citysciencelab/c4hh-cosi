import {generateSimpleGetters} from "../../../src/shared/js/utils/generators.js";
import bimFactorystate from "./stateBimFactory.js";

const getters = {
    ...generateSimpleGetters(bimFactorystate),
    getWorkflowForId: state => workflowId => {
        const result = state.workflowsJSON?.workflows?.filter((workflow) => {
            return workflow.id === workflowId;
        });

        if (result && result.length === 1) {
            return result[0];
        }

        return null;
    },
    getWorkflowDetailsForId: state => workflowId => {
        const result = state.workflowsDetails?.filter((workflow) => {
            return workflow.workflowId === workflowId;
        });

        if (result && result.length === 1) {
            return result[0];
        }

        return null;
    }
};

export default getters;
