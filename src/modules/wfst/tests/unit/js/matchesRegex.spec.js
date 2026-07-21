import {expect} from "chai";
import sinon from "sinon";
import matchesRegex from "@modules/wfst/js/matchesRegex.js";

describe("src/modules/wfst/js/matchesRegex.js", () => {
    afterEach(() => {
        sinon.restore();
    });

    it("should return true if the value matches the pattern", () => {
        expect(matchesRegex("^[0-9]{5}$", "12345")).to.be.true;
    });

    it("should return false if the value does not match the pattern", () => {
        expect(matchesRegex("^[0-9]{5}$", "1234")).to.be.false;
    });

    it("should coerce nullish values to an empty string before testing", () => {
        expect(matchesRegex("^$", null)).to.be.true;
        expect(matchesRegex("^.+$", undefined)).to.be.false;
    });

    it("should fail open and warn if the pattern cannot be compiled", () => {
        const warnStub = sinon.stub(console, "warn");

        expect(matchesRegex("[", "anything")).to.be.true;
        expect(warnStub.calledOnce).to.be.true;
    });
});
