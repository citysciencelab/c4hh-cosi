import {generateSimpleGetters} from "../../../../src/shared/js/utils/generators";
import vueAddonState from "./stateDipasProjects";

const getters = {
    ...generateSimpleGetters(vueAddonState)
};

export default getters;
