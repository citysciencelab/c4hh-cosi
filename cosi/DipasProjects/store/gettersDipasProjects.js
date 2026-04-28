import {generateSimpleGetters} from "../../../../src/shared/js/utils/generators";
import stateDipasProjects from "./stateDipasProjects";

const getters = {
    ...generateSimpleGetters(stateDipasProjects)
};

export default getters;
