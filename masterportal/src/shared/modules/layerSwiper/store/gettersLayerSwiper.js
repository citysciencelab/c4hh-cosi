import {generateSimpleGetters} from "@shared/js/utils/generators.js";
import stateLayerSwiper from "./stateLayerSwiper.js";

const getters = {
    /**
     * Creates from every state-key a getter.
     */
    ...generateSimpleGetters(stateLayerSwiper)
};

export default getters;
