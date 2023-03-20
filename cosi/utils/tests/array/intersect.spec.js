import {expect} from "chai";
import intersect from "../../array/intersect";
import sinon from "sinon";

describe("utils/array/intersect", () => {
    const firstArray = [1, 2, "3", true, false, null, undefined, {}],
        secondArray = [2, 0, "3", undefined, "4", false, {}, null],
        expectedArray = [2, "3", false, null, undefined];

    beforeEach(function () {
        sinon.spy(console, "error");
    });

    afterEach(function () {
        console.error.restore();
        sinon.restore();
    });

    it("should return an empty array if the given parameter is an object", () => {
        expect(intersect({})).to.be.an("array").that.is.empty;
    });

    it("should return an empty array if the given parameter is undefined", () => {
        expect(intersect(undefined)).to.be.an("array").that.is.empty;
    });

    it("should return an empty array if the given parameter is a boolean", () => {
        expect(intersect(true)).to.be.an("array").that.is.empty;
    });

    it("should return an empty array if the given parameter is a string", () => {
        expect(intersect("string")).to.be.an("array").that.is.empty;
    });

    it("should return an empty array if the given parameter is null", () => {
        expect(intersect(null)).to.be.an("array").that.is.empty;
    });

    it("should return an empty array if the given parameter is a number", () => {
        expect(intersect(666)).to.be.an("array").that.is.empty;
    });

    it("should call an error if the given parameter is not an array", () => {
        intersect(666);
        expect(console.error.calledOnce).to.be.true;
    });

    it("should return an empty array if the second passed parameter is an object", () => {
        expect(intersect([], {})).to.be.an("array").that.is.empty;
    });

    it("should return an empty array if the second passed parameter is undefined", () => {
        expect(intersect([], undefined)).to.be.an("array").that.is.empty;
    });

    it("should return an empty array if the second passed parameter is a boolean", () => {
        expect(intersect([], true)).to.be.an("array").that.is.empty;
    });

    it("should return an empty array if the second passed parameter is a string", () => {
        expect(intersect([], "string")).to.be.an("array").that.is.empty;
    });

    it("should return an empty array if the second passed parameter is null", () => {
        expect(intersect([], null)).to.be.an("array").that.is.empty;
    });

    it("should return an empty array if the second passed parameter is a number", () => {
        expect(intersect([], 666)).to.be.an("array").that.is.empty;
    });

    it("should call an error if the second passed parameter is not an array", () => {
        intersect([], 666);
        expect(console.error.calledOnce).to.be.true;
    });

    it("should return the expected array", () => {
        expect(intersect(firstArray, secondArray)).to.deep.equal(expectedArray);
    });
});
