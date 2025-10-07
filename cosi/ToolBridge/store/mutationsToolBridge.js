import {generateSimpleMutations} from "../../../../src/shared/js/utils/generators";
import ToolBridgeState from "./stateToolBridge";

const mutations = {
    ...generateSimpleMutations(ToolBridgeState)
};

export default mutations;
