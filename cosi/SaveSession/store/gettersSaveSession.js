import {generateSimpleGetters} from "../../../../src/app-store/utils/generators";
import stateSaveSession from "./stateSaveSession";

const getters = {
    ...generateSimpleGetters(stateSaveSession)
};


export default getters;
