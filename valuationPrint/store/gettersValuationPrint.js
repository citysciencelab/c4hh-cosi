
import {generateSimpleGetters} from ".../../../src/app-store/utils/generators";
import ValuationState from "./stateValuationPrint.js";

const getters = {
    ...generateSimpleGetters(ValuationState)
};

export default getters;
