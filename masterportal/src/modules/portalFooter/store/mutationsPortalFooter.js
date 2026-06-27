import {generateSimpleMutations} from "@shared/js/utils/generators.js";
import statePortalFooter from "./statePortalFooter.js";

const mutations = {
    ...generateSimpleMutations(statePortalFooter)
};

export default mutations;
