
import {generateSimpleGetters} from "../../../src/shared/js/utils/generators.js";
import WaterRiskState from "./stateWaterRiskCheck.js";

const getters = {
    ...generateSimpleGetters(WaterRiskState)
};

export default getters;
