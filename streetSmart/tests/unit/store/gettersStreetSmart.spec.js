import {expect} from "chai";
import getters from "../../../store/gettersStreetSmart";


describe("addons/StreetSmart/store/gettersStreetSmart", function () {
    describe("currentLocale", function () {

        it("returns the 'de' if currentLocale is 'de'", function () {
            const rootGetters = {
                    "Language/currentLocale": "de"
                },
                locale = getters.currentLocale({}, {}, {}, rootGetters);

            expect(locale).to.be.eql("de");
        });
        it("returns the 'en-US' if currentLocale is 'en'", function () {
            const rootGetters = {
                    "Language/currentLocale": "en"
                },
                locale = getters.currentLocale({}, {}, {}, rootGetters);

            expect(locale).to.be.eql("en-US");
        });
        it("returns the 'pt-BR' if currentLocale is 'pt'", function () {
            const rootGetters = {
                    "Language/currentLocale": "pt"
                },
                locale = getters.currentLocale({}, {}, {}, rootGetters);

            expect(locale).to.be.eql("pt-BR");
        });
        it("returns the 'de' if currentLocale is 'es'", function () {
            const rootGetters = {
                    "Language/currentLocale": "es"
                },
                locale = getters.currentLocale({}, {}, {}, rootGetters);

            expect(locale).to.be.eql("de");
        });
        it("returns the 'de' if currentLocale is 'tr'", function () {
            const rootGetters = {
                    "Language/currentLocale": "tr"
                },
                locale = getters.currentLocale({}, {}, {}, rootGetters);

            expect(locale).to.be.eql("de");
        });
        it("returns the 'de' if currentLocale is undefined", function () {
            const rootGetters = {
                    "Language/currentLocale": undefined
                },
                locale = getters.currentLocale({}, {}, {}, rootGetters);

            expect(locale).to.be.eql("de");
        });
        it("returns the 'de' if currentLocale is null", function () {
            const rootGetters = {
                    "Language/currentLocale": null
                },
                locale = getters.currentLocale({}, {}, {}, rootGetters);

            expect(locale).to.be.eql("de");
        });
    });
});
