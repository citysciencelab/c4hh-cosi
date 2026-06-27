
import {generateSimpleGetters} from "../../../../src/shared/js/utils/generators";
import stateAreaSelector from "./stateAreaSelector";

const getters = {
    ...generateSimpleGetters(stateAreaSelector)
};

export default getters;
