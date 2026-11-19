import {generateSimpleGetters} from "@shared/js/utils/generators.js";
import statePlanningTwin from "./statePlanningTwin";

const getters = {
    ...generateSimpleGetters(statePlanningTwin)
};

export default getters;
