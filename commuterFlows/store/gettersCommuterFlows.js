
import {generateSimpleGetters} from "../../../src/shared/js/utils/generators.js";
import commuterFlowsState from "./stateCommuterFlows.js";

const getters = {
    ...generateSimpleGetters(commuterFlowsState)
};

export default getters;
