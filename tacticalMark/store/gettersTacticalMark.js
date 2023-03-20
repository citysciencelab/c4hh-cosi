
import {generateSimpleGetters} from ".../../../src/app-store/utils/generators";
import tacticalMarkState from "./stateTacticalMark";

const getters = {
    ...generateSimpleGetters(tacticalMarkState)
};

export default getters;
