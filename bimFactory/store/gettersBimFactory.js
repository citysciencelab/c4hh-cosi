import {generateSimpleGetters} from "../../../src/shared/js/utils/generators";
import state from "./stateBimFactory";

const getters = {
    ...generateSimpleGetters(state)
};

export default getters;
