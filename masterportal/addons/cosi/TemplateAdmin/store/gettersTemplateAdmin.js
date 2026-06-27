import {generateSimpleGetters} from "../../../../src/shared/js/utils/generators";
import initialState from "./stateTemplateAdmin";

const getters = {
    ...generateSimpleGetters(initialState)
};

export default getters;
