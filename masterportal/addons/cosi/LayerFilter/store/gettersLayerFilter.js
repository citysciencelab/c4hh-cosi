import {generateSimpleGetters} from "@shared/js/utils/generators.js";
import stateLayerFilter from "./stateLayerFilter";

const getters = {
    ...generateSimpleGetters(stateLayerFilter)
};

export default getters;
