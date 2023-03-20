import GenericTool from "../../../src/modules/tools/indexTools";
import composeModules from "../../../src/app-store/utils/composeModules";
import getters from "./gettersTacticalMark";
import mutations from "./mutationsTacticalMark";
import state from "./stateTacticalMark";

export default composeModules([GenericTool, {
    namespaced: true,
    state: {...state},
    mutations,
    getters
}]);
