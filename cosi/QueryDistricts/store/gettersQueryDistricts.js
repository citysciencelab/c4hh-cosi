
import {generateSimpleGetters} from "../../../../src/app-store/utils/generators";
import vueAddonState from "./stateQueryDistricts";

const getters = {
    ...generateSimpleGetters(vueAddonState)
};

export default getters;
