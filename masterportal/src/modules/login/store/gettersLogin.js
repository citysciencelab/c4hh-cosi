import stateLogin from "./stateLogin.js";
import {generateSimpleGetters} from "@shared/js/utils/generators.js";

/**
 * The getters for the Login.
 * @module modules/login/store/gettersLogin
 */
const gettersMap = {
    ...generateSimpleGetters(stateLogin)
};

export default gettersMap;
