import {generateSimpleGetters} from "@shared/js/utils/generators.js";
import statePortalFooter from "./statePortalFooter.js";

const getters = {
    ...generateSimpleGetters(statePortalFooter)
};

export default getters;
