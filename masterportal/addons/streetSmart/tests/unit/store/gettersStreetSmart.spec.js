import {expect} from "chai";
import getters from "../../../store/gettersStreetSmart.js";

describe("addons/StreetSmart/store/gettersStreetSmart", function () {
    describe("currentLocale", function () {

        it("returns 'de' if currentLocale is 'de'", function () {
            const rootGetters = {
                    "Modules/Language/currentLocale": "de"
                },
                locale = getters.currentLocale({}, {}, {}, rootGetters);

            expect(locale).to.be.eql("de");
        });
        it("returns 'en-US' if currentLocale is 'en'", function () {
            const rootGetters = {
                    "Modules/Language/currentLocale": "en"
                },
                locale = getters.currentLocale({}, {}, {}, rootGetters);

            expect(locale).to.be.eql("en-US");
        });
        it("returns 'pt-BR' if currentLocale is 'pt'", function () {
            const rootGetters = {
                    "Modules/Language/currentLocale": "pt"
                },
                locale = getters.currentLocale({}, {}, {}, rootGetters);

            expect(locale).to.be.eql("pt-BR");
        });
        it("returns 'de' if currentLocale is 'es'", function () {
            const rootGetters = {
                    "Modules/Language/currentLocale": "es"
                },
                locale = getters.currentLocale({}, {}, {}, rootGetters);

            expect(locale).to.be.eql("de");
        });
        it("returns 'de' if currentLocale is 'tr'", function () {
            const rootGetters = {
                    "Modules/Language/currentLocale": "tr"
                },
                locale = getters.currentLocale({}, {}, {}, rootGetters);

            expect(locale).to.be.eql("de");
        });
        it("returns 'de' if currentLocale is undefined", function () {
            const rootGetters = {
                    "Modules/Language/currentLocale": undefined
                },
                locale = getters.currentLocale({}, {}, {}, rootGetters);

            expect(locale).to.be.eql("de");
        });
        it("returns 'de' if currentLocale is null", function () {
            const rootGetters = {
                    "Modules/Language/currentLocale": null
                },
                locale = getters.currentLocale({}, {}, {}, rootGetters);

            expect(locale).to.be.eql("de");
        });
        it("gets the locale from localstorage", async function () {
            global.localStorage = {
                "i18nextLng": "en"
            };
            const rootGetters = {
                    "Modules/Language/currentLocale": ""
                },
                locale = getters.currentLocale({}, {}, {}, rootGetters);

            expect(locale).to.be.eql("en-US");
        });
        it("defaults to de if the localStorage language is not available", async function () {
            global.localStorage = {
                "i18nextLng": "it"
            };
            const rootGetters = {
                    "Modules/Language/currentLocale": ""
                },
                locale = getters.currentLocale({}, {}, {}, rootGetters);

            expect(locale).to.be.eql("de");
        });
    });
});
