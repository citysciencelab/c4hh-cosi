
import {generateSimpleGetters} from "../../../../src/shared/js/utils/generators";
import chartGeneratorState from "./stateChartGenerator";

const getters = {
    ...generateSimpleGetters(chartGeneratorState)
};

export default getters;
