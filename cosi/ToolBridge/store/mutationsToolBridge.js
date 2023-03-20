import {generateSimpleMutations} from "../../../../src/app-store/utils/generators";
import ToolBridgeState from "./stateToolBridge";

const mutations = {
    ...generateSimpleMutations(ToolBridgeState)
};

export default mutations;
