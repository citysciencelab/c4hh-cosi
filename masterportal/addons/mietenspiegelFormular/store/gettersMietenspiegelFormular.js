import {generateSimpleGetters} from "../../../src/shared/js/utils/generators.js";
import MietenspiegelFormularState from "./stateMietenspiegelFormular.js";

const getters = {
    ...generateSimpleGetters(MietenspiegelFormularState)
};

export default getters;
