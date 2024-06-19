import {generateSimpleGetters} from "../../../src/shared/js/utils/generators";
import state from "./statePopulationRequest";

const getters = {
    ...generateSimpleGetters(state)
};

export default getters;
