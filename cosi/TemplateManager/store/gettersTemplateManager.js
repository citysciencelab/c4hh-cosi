import {generateSimpleGetters} from "../../../../src/app-store/utils/generators";
import stateTemplateManager from "./stateTemplateManager";

const getters = {
    ...generateSimpleGetters(stateTemplateManager)
};


export default getters;
