import {generateSimpleGetters} from "../../../src/shared/js/utils/generators";
import stateStreetSmart from "./stateStreetSmart";

const getters = {
    ...generateSimpleGetters(stateStreetSmart),

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
