
import {generateSimpleGetters} from "@shared/js/utils/generators.js";
import CosiFileImportState from "./stateCosiFileImport";

const getters = {
    ...generateSimpleGetters(CosiFileImportState)

    // NOTE overwrite getters here if you need a special behaviour in a getter
};

export default getters;
