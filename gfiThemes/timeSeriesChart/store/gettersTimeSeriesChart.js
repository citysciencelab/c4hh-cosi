import {generateSimpleGetters} from "../../../../src/shared/js/utils/generators.js";
import state from "./stateTimeSeriesChart.js";

const getters = {
    ...generateSimpleGetters(state)
};

export default getters;
