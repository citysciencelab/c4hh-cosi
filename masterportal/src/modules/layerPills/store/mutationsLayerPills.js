import {generateSimpleMutations} from "@shared/js/utils/generators.js";
import stateLayerPills from "./stateLayerPills.js";

const mutations = {
    ...generateSimpleMutations(stateLayerPills)
};

export default mutations;
