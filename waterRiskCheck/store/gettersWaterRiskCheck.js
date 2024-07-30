
import {generateSimpleGetters} from "../../../src/shared/js/utils/generators";
import WaterRiskState from "./stateWaterRiskCheck";

const getters = {
    ...generateSimpleGetters(WaterRiskState)
};

export default getters;
