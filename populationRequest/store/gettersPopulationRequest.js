import {generateSimpleGetters} from ".../../../src/app-store/utils/generators";
import state from "./statePopulationRequest";

const getters = {
    ...generateSimpleGetters(state)
};

export default getters;
