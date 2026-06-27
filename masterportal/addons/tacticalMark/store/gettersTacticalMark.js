
import {generateSimpleGetters} from "@shared/js/utils/generators";
import tacticalMarkState from "./stateTacticalMark";

const getters = {
    ...generateSimpleGetters(tacticalMarkState)
};

export default getters;
