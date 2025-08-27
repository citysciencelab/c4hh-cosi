import {generateSimpleMutations} from "../../../src/shared/js/utils/generators";
import stateGeoMarker from "./stateGeoMarker";

const mutations = {
    ...generateSimpleMutations(stateGeoMarker)
};

export default mutations;
