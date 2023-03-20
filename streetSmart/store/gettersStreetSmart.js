import {generateSimpleGetters} from "../../../src/app-store/utils/generators";
import state from "./stateStreetSmart";

const getters = {
    /**
     * Returns an object of simple getters for a state object, where
     * simple means that they will just return an entry for any key.
     * For example, given a state object {key: value}, an object
     * {key: state => state[key]} will be returned.
     * This is useful to avoid writing basic operations.
     * @param {object} state state to generate getters for
     * @returns {object.<string, function>} object of getters
     */
    ...generateSimpleGetters(state),

    /**
     * Returns the dedicated supported locale of StreetsmartApi, if available, else returns "de".
     * The following locales are supported by StreetsmartApi v22: de, en-GB, en-US, fi, fr, nl, pt-BR.
     * @param {object} ___ streetsmart store state
     * @param {object} __ streetsmart store getters
     * @param {object} _ root state
     * @param {object} rootGetters root getters
     * @returns {string} the current locale if supported or "de"
     */
    currentLocale (___, __, _, rootGetters) {
        let locale = rootGetters["Language/currentLocale"];

        if (locale === "en") {
            locale = "en-US";
        }
        else if (locale === "pt") {
            locale = "pt-BR";
        }
        else {
            locale = "de";
        }
        return locale;
    }
};

export default getters;
