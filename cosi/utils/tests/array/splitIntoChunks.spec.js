import {expect} from "chai";
import {splitIntoChunks} from "../../array/splitIntoChunks";
import sinon from "sinon";

describe("utils/array/splitIntoChunks", () => {
    const testArray = ["a", "b", "c", "d", "e", "f"];

    beforeEach(function () {
        sinon.spy(console, "error");
    });

    afterEach(function () {
        console.error.restore();
        sinon.restore();
    });

    it("should return false if the given parameter is an object", () => {
        expect(splitIntoChunks({})).to.be.false;
    });

    it("should return false if the given parameter is undefined", () => {
        expect(splitIntoChunks(undefined)).to.be.false;
    });

    it("should return false if the given parameter is a boolean", () => {
        expect(splitIntoChunks(true)).to.be.false;
    });

    it("should return false if the given parameter is a string", () => {
        expect(splitIntoChunks("string")).to.be.false;
    });

    it("should return false if the given parameter is null", () => {
        expect(splitIntoChunks(null)).to.be.false;
    });

    it("should return false if the given parameter is a number", () => {
        expect(splitIntoChunks(666)).to.be.false;
    });

    it("should call an error if the given parameter is not an array", () => {
        splitIntoChunks(666);
        expect(console.error.calledOnce).to.be.true;
    });

    it("should return false if the second passed parameter is an object", () => {
        expect(splitIntoChunks([], {})).to.be.false;
    });

    it("should return false if the second passed parameter is undefined", () => {
        expect(splitIntoChunks([], undefined)).to.be.false;
    });

    it("should return false if the second passed parameter is a boolean", () => {
        expect(splitIntoChunks([], true)).to.be.false;
    });

    it("should return false if the second passed parameter is a string", () => {
        expect(splitIntoChunks([], "string")).to.be.false;
    });

    it("should return false if the second passed parameter is null", () => {
        expect(splitIntoChunks([], null)).to.be.false;
    });

    it("should return false if the second passed parameter is an array", () => {
        expect(splitIntoChunks([], [])).to.be.false;
    });

    it("should call an error if the second passed parameter is not a number", () => {
        splitIntoChunks([], true);
        expect(console.error.calledOnce).to.be.true;
    });

    it("should split the given array into two chunks", () => {
        expect(splitIntoChunks(testArray, 4)).to.deep.equal([["a", "b", "c", "d"], ["e", "f"]]);
    });

    it("should split the given array into six chunks", () => {
        expect(splitIntoChunks(testArray, 1)).to.deep.equal([["a"], ["b"], ["c"], ["d"], ["e"], ["f"]]);
    });
});
