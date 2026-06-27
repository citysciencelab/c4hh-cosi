
import {generateSimpleGetters} from "../../../src/shared/js/utils/generators.js";
import stateFloodRiskManagement from "./stateFloodRiskManagement.js";

const getters = {
    ...generateSimpleGetters(stateFloodRiskManagement)
};

export default getters;
