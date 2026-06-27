import {generateSimpleGetters} from "../../../src/shared/js/utils/generators.js";
import sessionToolState from "./stateSessionTool.js";

const getters = {
    ...generateSimpleGetters(sessionToolState)

    // NOTE overwrite getters here if you need a special behaviour in a getter
};

export default getters;
