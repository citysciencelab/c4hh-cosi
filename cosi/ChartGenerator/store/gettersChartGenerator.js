
import {generateSimpleGetters} from "../../../../src/app-store/utils/generators";
import chartGeneratorState from "./stateChartGenerator";

const getters = {
    ...generateSimpleGetters(chartGeneratorState)
};

export default getters;
