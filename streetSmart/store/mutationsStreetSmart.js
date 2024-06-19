import {generateSimpleMutations} from "../../../src/shared/js/utils/generators";
import stateStreetSmart from "./stateStreetSmart";

const mutations = {
    ...generateSimpleMutations(stateStreetSmart)

};

export default mutations;
