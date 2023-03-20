
import {generateSimpleGetters} from "../../../../src/app-store/utils/generators";
import stateDashboard from "./stateDashboard";

const getters = {
    ...generateSimpleGetters(stateDashboard),
    // this is required to make this addon compatible with the toolBridge addon (see toolBridge documentation).
    // the definition here must match the input expected by the watcher on the `toolBridgeIn` variable
    toolBridgeOut: (state) => {
        return {
            // something that matches what the toolBridgeIn watcher expects.
            statsFeatureFilter: state.statsFeatureFilter,
            calculations: state.calculations,
            exportTimeline: state.exportTimeline
        };

    }
};


export default getters;
