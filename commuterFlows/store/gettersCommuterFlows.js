
import {generateSimpleGetters} from ".../../../src/app-store/utils/generators";
import commuterFlowsState from "./stateCommuterFlows";

const getters = {
    ...generateSimpleGetters(commuterFlowsState)
};

export default getters;
