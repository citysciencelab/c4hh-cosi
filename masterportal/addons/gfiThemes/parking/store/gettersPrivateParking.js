import state from "./statePrivateParking.js";
import {generateSimpleGetters} from "../../../../src/shared/js/utils/generators.js";


const getters = {
    ...generateSimpleGetters(state)
};

export default getters;
