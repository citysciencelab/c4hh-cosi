
import {generateSimpleGetters} from ".../../../src/app-store/utils/generators";
import vueAddonState from "./stateVueAddon";

const getters = {
    ...generateSimpleGetters(vueAddonState)
};

export default getters;
