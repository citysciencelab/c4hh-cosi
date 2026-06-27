import {generateSimpleGetters} from "@shared/js/utils/generators.js";
import stateOpenConfig from "./stateOpenConfig.js";

const getters = {
    ...generateSimpleGetters(stateOpenConfig)
};

export default getters;
