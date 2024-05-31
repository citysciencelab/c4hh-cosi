
import {generateSimpleGetters} from "../../../../src_3_0_0/shared/js/utils/generators";
import commuterFlowsState from "./stateCommuterFlows";

const getters = {
    ...generateSimpleGetters(commuterFlowsState)
};

export default getters;
