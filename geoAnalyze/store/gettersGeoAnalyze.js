
import {generateSimpleGetters} from ".../../../src/app-store/utils/generators";
import vueAddonState from "./stateGeoAnalyze";

const getters = {
    ...generateSimpleGetters(vueAddonState)
};

export default getters;
