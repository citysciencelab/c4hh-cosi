import {expect} from "chai";
import sinon from "sinon";
import i18next from "i18next";
import {normalizeLanguageCode} from "@plugins/i18next";

describe("src/plugins/i18next.js", () => {
    describe("normalizeLanguageCode", () => {
        const fallbackLanguage = "de";
        const languages = {de: "deutsch", en: "english"};
        let changeLanguageStub;

        beforeEach(() => {
            changeLanguageStub = sinon.stub(i18next, "changeLanguage");
        });

        it("should not call changeLanguage if the detected language code has no region suffix", () => {
            sinon.stub(i18next, "language").value("de");

            normalizeLanguageCode({fallbackLanguage, languages});

            expect(changeLanguageStub.called).to.be.false;
        });

        it("should change to the base language if it is supported and a region suffix is detected", () => {
            sinon.stub(i18next, "language").value("en-US");

            normalizeLanguageCode({fallbackLanguage, languages});

            expect(changeLanguageStub.calledOnceWith("en")).to.be.true;
        });

        it("should change to the fallback language if the base language is not supported", () => {
            sinon.stub(i18next, "language").value("fr-FR");

            normalizeLanguageCode({fallbackLanguage, languages});

            expect(changeLanguageStub.calledOnceWith(fallbackLanguage)).to.be.true;
        });

        it("should use only the first segment of a multi-part language code (e.g. de-Latn-DE)", () => {
            sinon.stub(i18next, "language").value("de-Latn-DE");

            normalizeLanguageCode({fallbackLanguage, languages});

            expect(changeLanguageStub.calledOnceWith("de")).to.be.true;
        });
    });
});
