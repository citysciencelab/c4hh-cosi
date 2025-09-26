
import {generateSimpleGetters} from "@shared/js/utils/generators.js";
import colorCodeMapState from "./stateColorCodeMap";

const getters = {
    ...generateSimpleGetters(colorCodeMapState)
};

export default getters;
