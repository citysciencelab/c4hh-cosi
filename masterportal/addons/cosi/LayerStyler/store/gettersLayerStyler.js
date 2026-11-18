import {generateSimpleGetters} from "@shared/js/utils/generators.js";
import stateLayerStyler from "./stateLayerStyler";

const getters = {
    ...generateSimpleGetters(stateLayerStyler)
};

export default getters;
