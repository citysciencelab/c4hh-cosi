import {generateSimpleMutations} from "@shared/js/utils/generators.js";
import stateLayerClusterToggler from "./stateLayerClusterToggler.js";

const mutations = {
    ...generateSimpleMutations(stateLayerClusterToggler)
};

export default mutations;
