
import {generateSimpleGetters} from "../../../src/shared/js/utils/generators";
import commuterFlowsState from "./stateCommuterFlows";

const getters = {
    ...generateSimpleGetters(commuterFlowsState)
};

export default getters;
