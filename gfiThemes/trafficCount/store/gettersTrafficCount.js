import {generateSimpleGetters} from "../../../../src/shared/js/utils/generators";
import state from "./stateTrafficCount";

const getters = {
    ...generateSimpleGetters(state)
};

export default getters;
