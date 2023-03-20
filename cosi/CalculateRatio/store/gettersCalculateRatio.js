
import {generateSimpleGetters} from ".../../../src/app-store/utils/generators";
import calculateRatioState from "./stateCalculateRatio";

const getters = {
    ...generateSimpleGetters(calculateRatioState)
};

export default getters;
