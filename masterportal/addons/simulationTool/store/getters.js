import {generateSimpleGetters} from "../../../src/shared/js/utils/generators.js";
import state from "./state.js";

const getters = {
    ...generateSimpleGetters(state)
};

export default getters;
