
import {generateSimpleGetters} from "../../../../src/app-store/utils/generators";
import stateAreaSelector from "./stateAreaSelector";

const getters = {
    ...generateSimpleGetters(stateAreaSelector)
};

export default getters;
