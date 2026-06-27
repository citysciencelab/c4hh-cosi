import {generateSimpleGetters} from "@shared/js/utils/generators";
import stateSaveSession from "./stateSaveSession";

const getters = {
    ...generateSimpleGetters(stateSaveSession)
};


export default getters;
