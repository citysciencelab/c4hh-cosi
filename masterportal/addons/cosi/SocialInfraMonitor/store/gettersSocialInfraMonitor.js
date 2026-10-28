import {generateSimpleGetters} from "@shared/js/utils/generators";
import state from "./stateSocialInfraMonitor";

const getters = {
    ...generateSimpleGetters(state)
};

export default getters;
