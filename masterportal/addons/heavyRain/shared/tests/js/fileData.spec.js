import {expect} from "chai";
import {getDownloadFileName, hasAllowedExtension, toFileHref} from "../../js/fileData.js";

describe("addons/heavyRain/shared/js/fileData.js", () => {
    describe("toFileHref", () => {
        it("should keep a file saved as data url", () => {
            expect(toFileHref("data:application/pdf;base64,JVBERi0")).to.equal("data:application/pdf;base64,JVBERi0");
        });

        it("should add a generic data url prefix to a file saved as plain base64", () => {
            expect(toFileHref("JVBERi0")).to.equal("data:application/octet-stream;base64,JVBERi0");
        });

        it("should return undefined if there is no file", () => {
            expect(toFileHref(undefined)).to.be.undefined;
            expect(toFileHref(null)).to.be.undefined;
            expect(toFileHref("")).to.be.undefined;
            expect(toFileHref(" ")).to.be.undefined;
        });
    });

    describe("getDownloadFileName", () => {
        it("should use the name of the uploaded file", () => {
            expect(getDownloadFileName("data:application/pdf;base64,JVBERi0", "plan.pdf", "Projekt A")).to.equal("plan.pdf");
        });

        it("should create the name from the given name and the type of the file", () => {
            expect(getDownloadFileName("data:application/pdf;base64,JVBERi0", "", "Projekt A")).to.equal("Projekt A.pdf");
            expect(getDownloadFileName("data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64,UEs", undefined, "Projekt A")).to.equal("Projekt A.docx");
        });

        it("should use a generic name without a given name", () => {
            expect(getDownloadFileName("data:image/png;base64,iVBOR")).to.equal("Datei.png");
        });

        it("should create a name without extension for an unknown type", () => {
            expect(getDownloadFileName("JVBERi0", undefined, "Projekt A")).to.equal("Projekt A");
        });
    });

    describe("hasAllowedExtension", () => {
        const allowedExtensions = ["pdf", "docx"];

        it("should allow a file with an allowed extension independent of the case", () => {
            expect(hasAllowedExtension({name: "plan.pdf"}, allowedExtensions)).to.be.true;
            expect(hasAllowedExtension({name: "Bericht.DOCX"}, allowedExtensions)).to.be.true;
        });

        it("should not allow a file with another or without extension", () => {
            expect(hasAllowedExtension({name: "programm.exe"}, allowedExtensions)).to.be.false;
            expect(hasAllowedExtension({name: "pdf"}, allowedExtensions)).to.be.false;
            expect(hasAllowedExtension(undefined, allowedExtensions)).to.be.false;
        });
    });
});
