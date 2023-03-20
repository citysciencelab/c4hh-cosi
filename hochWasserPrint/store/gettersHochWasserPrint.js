import {generateSimpleGetters} from "../../../src/app-store/utils/generators";
import HochWasserPrintState from "./stateHochWasserPrint";

const getters = {
    ...generateSimpleGetters(HochWasserPrintState)

    // NOTE overwrite getters here if you need a special behaviour in a getter
};

export default getters;
