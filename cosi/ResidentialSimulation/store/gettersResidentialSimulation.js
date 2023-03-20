
import {generateSimpleGetters} from "../../../../src/app-store/utils/generators";
import stateResidentialSimulation from "./stateResidentialSimulation";

const getters = {
    ...generateSimpleGetters(stateResidentialSimulation)
};


export default getters;
