import {generateSimpleGetters} from "@shared/js/utils/generators.js";
import districtFinderState from "./stateDistrictFinder";

const getters = {
    ...generateSimpleGetters(districtFinderState)
};


export default getters;
