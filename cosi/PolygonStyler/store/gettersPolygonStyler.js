import {generateSimpleGetters} from "@shared/js/utils/generators.js";
import statePolygonStyler from "./statePolygonStyler";

const getters = {
    ...generateSimpleGetters(statePolygonStyler)
};

export default getters;
