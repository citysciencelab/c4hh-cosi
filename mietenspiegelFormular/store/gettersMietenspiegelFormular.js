import {generateSimpleGetters} from "../../../src/shared/js/utils/generators";
import MietenspiegelFormularState from "./stateMietenspiegelFormular.js";

const getters = {
    ...generateSimpleGetters(MietenspiegelFormularState)
};

export default getters;
