
import {generateSimpleGetters} from "../../../../src_3_0_0/shared/js/utils/generators";
import ValuationState from "./stateValuationPrint.js";

const getters = {
    ...generateSimpleGetters(ValuationState)
};

export default getters;
