
import {generateSimpleGetters} from "@shared/js/utils/generators";
import vueAddonState from "./stateGeoAnalyze";

const getters = {
    ...generateSimpleGetters(vueAddonState)
};

export default getters;
