
import {generateSimpleGetters} from "../../../../src/app-store/utils/generators";
import CosiFileImportState from "./stateCosiFileImport";

const getters = {
    ...generateSimpleGetters(CosiFileImportState)

    // NOTE overwrite getters here if you need a special behaviour in a getter
};

export default getters;
