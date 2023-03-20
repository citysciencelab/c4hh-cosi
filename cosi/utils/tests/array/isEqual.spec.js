import {expect} from "chai";
import {isEqual} from "../../array/isEqual";
import sinon from "sinon";

describe("utils/array/isEqual", () => {
    const obj1 = {},
        obj2 = {},
        firstArray = [1, 2, "3", obj1, obj2],
        secondArray = [1, 2, "3", obj1, obj2],
        thirdArray = [2, 1, obj2, "3", obj1],
        fourthArray = [3, obj2];

    beforeEach(function () {
        sinon.spy(console, "error");
    });

    afterEach(function () {
        console.error.restore();
        sinon.restore();
    });

    it("should return false if the given parameter is an object", () => {
        expect(isEqual({})).to.be.false;
    });

    it("should return false if the given parameter is undefined", () => {
        expect(isEqual(undefined)).to.be.false;
    });

    it("should return false if the given parameter is a boolean", () => {
        expect(isEqual(true)).to.be.false;
    });

    it("should return false if the given parameter is a string", () => {
        expect(isEqual("string")).to.be.false;
    });

    it("should return false if the given parameter is null", () => {
        expect(isEqual(null)).to.be.false;
    });

    it("should return false if the given parameter is a number", () => {
        expect(isEqual(666)).to.be.false;
    });

    it("should call an error if the given parameter is not an array", () => {
        isEqual(666);
        expect(console.error.calledOnce).to.be.true;
    });

    it("should return false if the second passed parameter is an object", () => {
        expect(isEqual([], {})).to.be.false;
    });

    it("should return false if the second passed parameter is undefined", () => {
        expect(isEqual([], undefined)).to.be.false;
    });

    it("should return false if the second passed parameter is a boolean", () => {
        expect(isEqual([], true)).to.be.false;
    });

    it("should return false if the second passed parameter is a string", () => {
        expect(isEqual([], "string")).to.be.false;
    });

    it("should return false if the second passed parameter is null", () => {
        expect(isEqual([], null)).to.be.false;
    });

    it("should return false if the second passed parameter is a number", () => {
        expect(isEqual([], 666)).to.be.false;
    });

    it("should call an error if the second passed parameter is not an array", () => {
        isEqual([], 666);
        expect(console.error.calledOnce).to.be.true;
    });

    it("should return false if the third passed parameter is an object", () => {
        expect(isEqual([], [], {})).to.be.false;
    });

    it("should return false if the third passed parameter is an array", () => {
        expect(isEqual([], [], [])).to.be.false;
    });

    it("should return false if the third passed parameter is a string", () => {
        expect(isEqual([], [], "string")).to.be.false;
    });

    it("should return false if the third passed parameter is null", () => {
        expect(isEqual([], [], null)).to.be.false;
    });

    it("should return false if the third passed parameter is a number", () => {
        expect(isEqual([], [], 666)).to.be.false;
    });

    it("should call an error if the third passed parameter is not an array", () => {
        isEqual([], [], 666);
        expect(console.error.calledOnce).to.be.true;
    });

    it("should return true if the third passed parameter is undefined", () => {
        expect(isEqual([], [], undefined)).to.be.true;
    });

    it("should return true if the passed arrays are equal and have the same order", () => {
        expect(isEqual(firstArray, secondArray, true)).to.be.true;
    });

    it("should return true if the passed arrays are equal and have not the same order", () => {
        expect(isEqual(firstArray, thirdArray)).to.be.true;
    });

    it("should return false if the passed arrays are equal and have not the same order", () => {
        expect(isEqual(firstArray, thirdArray, true)).to.be.false;
    });

    it("should return false if the passed arrays are not equal", () => {
        expect(isEqual(firstArray, fourthArray)).to.be.false;
    });
});
