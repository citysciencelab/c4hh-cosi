import {generateSimpleGetters} from "@shared/js/utils/generators.js";
import stateNewsView from "./stateNewsView.js";

const getters = {
    ...generateSimpleGetters(stateNewsView)
};

export default getters;
