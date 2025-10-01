
import {generateSimpleGetters} from "../../../../src/shared/js/utils/generators";
import calculateRatioState from "./stateCalculateRatio";

const getters = {
    ...generateSimpleGetters(calculateRatioState)
};

export default getters;
