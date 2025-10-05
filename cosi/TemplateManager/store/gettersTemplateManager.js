import {generateSimpleGetters} from "@shared/js/utils/generators";
import stateTemplateManager from "./stateTemplateManager";

const getters = {
    ...generateSimpleGetters(stateTemplateManager)
};


export default getters;
