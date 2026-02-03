import {generateSimpleMutations} from "../../../src/shared/js/utils/generators.js";
import stateStreetSmart from "./stateStreetSmart.js";

const mutations = {
    ...generateSimpleMutations(stateStreetSmart)

};

export default mutations;
