import {generateSimpleMutations} from "../../../../src/shared/js/utils/generators";
import initialState from "./stateTemplateAdmin";

const mutations = {
    ...generateSimpleMutations(initialState)
};

export default mutations;
