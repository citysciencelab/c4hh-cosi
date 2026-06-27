import {generateSimpleGetters} from "@shared/js/utils/generators.js";
import stateLayerPills from "./stateLayerPills.js";

const getters = {
    ...generateSimpleGetters(stateLayerPills)
};

export default getters;
