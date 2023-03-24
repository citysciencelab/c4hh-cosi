import {generateSimpleGetters} from "../../../../src_3_0_0/shared/js/utils/generators";
import state from "./statePopulationRequest";

const getters = {
    ...generateSimpleGetters(state)
};

export default getters;
