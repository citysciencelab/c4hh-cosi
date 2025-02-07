
import {generateSimpleGetters} from "../../../src/shared/js/utils/generators";
import stateFloodRiskManagement from "./stateFloodRiskManagement";

const getters = {
    ...generateSimpleGetters(stateFloodRiskManagement)
};

export default getters;
