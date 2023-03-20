import GenericTool from "../../../src/modules/tools/indexTools";
import composeModules from "../../../src/app-store/utils/composeModules";
import getters from "./gettersCommuterFlows";
import mutations from "./mutationsCommuterFlows";
import state from "./stateCommuterFlows";

export default composeModules([GenericTool, {
    namespaced: true,
    state: {...state},
    mutations,
    getters
}]);
