import {generateSimpleGetters} from "../../../src/shared/js/utils/generators";
import state from "./stateBimFabrikHH";

const getters = {
    ...generateSimpleGetters(state)
};

export default getters;
