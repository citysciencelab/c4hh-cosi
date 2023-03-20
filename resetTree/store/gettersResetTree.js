
import {generateSimpleGetters} from ".../../../src/app-store/utils/generators";
import resetTreeState from "./stateResetTree";

const getters = {
    ...generateSimpleGetters(resetTreeState)
};

export default getters;
