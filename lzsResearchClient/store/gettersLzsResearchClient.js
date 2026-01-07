import {generateSimpleGetters} from "@shared/js/utils/generators";
import state from "./stateLzsResearchClient";

const getters = {
    ...generateSimpleGetters(state)
};

export default getters;
