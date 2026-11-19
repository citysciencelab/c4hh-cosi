import {generateSimpleMutations} from "@shared/js/utils/generators.js";
import statePlanningTwin from "./statePlanningTwin";

const mutations = {
    ...generateSimpleMutations(statePlanningTwin)
};

export default mutations;
