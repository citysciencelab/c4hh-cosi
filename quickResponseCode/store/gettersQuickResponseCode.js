import {generateSimpleGetters} from "../../../src/app-store/utils/generators";
import stateQuickResponseCode from "./stateQuickResponseCode";

const getters = {
    ...generateSimpleGetters(stateQuickResponseCode)
};

export default getters;
