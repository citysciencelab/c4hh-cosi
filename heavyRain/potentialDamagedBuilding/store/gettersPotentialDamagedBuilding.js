
import {generateSimpleGetters} from "@shared/js/utils/generators.js";
import statePotentialDamagedBuilding from "./statePotentialDamagedBuilding.js";

const getters = {
    ...generateSimpleGetters(statePotentialDamagedBuilding)
};

export default getters;
