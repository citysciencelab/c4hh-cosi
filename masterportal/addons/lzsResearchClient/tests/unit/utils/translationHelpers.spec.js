import {expect} from "chai";
import sinon from "sinon";
import {capitalizeString, getTranslationForAttribute} from "../../../utils/translationHelpers";

/**
 * Run only utils tests via command:
 * npm run test:watch -- --grep="addons/lzsResearchClient/tests/unit/utils/"
 */
describe("addons/lzsResearchClient/utils/translationHelpers", () => {
    describe("capitalizeString", () => {
        it("should return correctly converted strings", () => {
            expect(capitalizeString("")).to.equal("");
            expect(capitalizeString(true)).to.be.true;
            expect(capitalizeString(false)).to.be.false;
            expect(capitalizeString(null)).to.be.null;
            expect(capitalizeString(undefined)).to.be.undefined;
            expect(capitalizeString()).to.be.undefined;
            expect(capitalizeString(123)).to.be.equal(123);
            expect(capitalizeString("BANANE")).to.equal("Banane");
            expect(capitalizeString("BANANEN BOOT")).to.equal("Bananen Boot");
            expect(capitalizeString("ApfeLKuchen")).to.equal("Apfelkuchen");
            expect(capitalizeString("apfeLKuchen")).to.equal("Apfelkuchen");
            expect(capitalizeString("Regen 123")).to.equal("Regen 123");
            expect(capitalizeString("winterSonne abendLICHT")).to.equal("Wintersonne Abendlicht");
            expect(capitalizeString("ABC-Straße")).to.equal("Abc-straße");
        });
    });

    describe("getTranslationForAttribute", () => {
        const originalI18next = global.i18next;

        beforeEach(() => {
            global.i18next = {
                t: sinon.stub().returns("translated"),
                exists: sinon.stub((key) => key === "keyExists")
            };
        });

        it("should find translations string or return given attributeName", () => {
            expect(getTranslationForAttribute("keyExists", "alternativeValue")).to.equal("translated");
            expect(getTranslationForAttribute("keyExistsNot", "alternativeValue")).to.equal("alternativeValue");
        });

        afterEach(() => {
            global.i18next = originalI18next;
        });
    });
});
