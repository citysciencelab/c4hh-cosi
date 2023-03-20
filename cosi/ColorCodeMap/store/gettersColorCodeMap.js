
import {generateSimpleGetters} from "../../../../src/app-store/utils/generators";
import colorCodeMapState from "./stateColorCodeMap";

const getters = {
    ...generateSimpleGetters(colorCodeMapState)
};

export default getters;
