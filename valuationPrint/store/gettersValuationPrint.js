
import {generateSimpleGetters} from "../../../src/shared/js/utils/generators";
import ValuationState from "./stateValuationPrint.js";

const getters = {
    ...generateSimpleGetters(ValuationState)
};

export default getters;
