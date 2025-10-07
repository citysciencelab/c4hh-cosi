import {generateSimpleGetters} from "../../../../src/shared/js/utils/generators";
import ToolBridgeState from "./stateToolBridge";

const getters = {
    ...generateSimpleGetters(ToolBridgeState),

    // currentSettings allows other tools to get the settings of another tool like this:
    // // import this getter
    // mapGetters("Modules/ToolBridge", ["currentSettings"])
    // // call getter
    // currentSettings("SomeToolName");
    currentSettings: (toolBridgeState, toolBridgeGetters, rootState, rootGetters) => {
        return (toolName) => { // the getter returns a function ("Method Style Access") to allow parameters (see https://vuex.vuejs.org/guide/getters.html#method-style-access)
            return rootGetters["Modules/" + toolName + "/toolBridgeOut"];
        };
    }

};

export default getters;
