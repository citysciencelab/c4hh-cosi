import {generateSimpleGetters} from "../../../src/shared/js/utils/generators";
import stateGeoMarker from "./stateGeoMarker";

const getters = {
    ...generateSimpleGetters(stateGeoMarker)
};

export default getters;
