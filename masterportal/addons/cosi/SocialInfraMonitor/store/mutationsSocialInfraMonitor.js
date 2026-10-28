import {generateSimpleMutations} from "@shared/js/utils/generators";
import state from "./stateSocialInfraMonitor";

const mutations = {
    ...generateSimpleMutations(state)
};

export default mutations;
