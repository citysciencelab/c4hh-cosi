import {expect} from "chai";
import getSource from "../../layer/getLayerSource";
import {filterAllFeatures} from "../../layer/filterAllFeatures";
import sinon from "sinon";

describe("addons/cosi/utils/layer/filterAllFeatures", () => {

    beforeEach(function () {
        sinon.spy(console, "error");
        sinon.stub(getSource, "getLayerSource").returns({
            getFeatures: () => [1, 2, 3, 4, 5]
        });
    });

    afterEach(function () {
        console.error.restore();
        sinon.restore();
    });

    describe("filterAllFeatures", () => {
        it("should return an empty array if the given param is an object", () => {
            expect(filterAllFeatures({})).to.be.empty;
        });

        it("should return an empty array if the given param is null", () => {
            expect(filterAllFeatures(null)).to.be.empty;
        });

        it("should return an empty array if the given param is undefined", () => {
            expect(filterAllFeatures(undefined)).to.be.empty;
        });

        it("should return an empty array if the given param is a number", () => {
            expect(filterAllFeatures(666)).to.be.empty;
        });

        it("should return an empty array if the given param is a string", () => {
            expect(filterAllFeatures("666")).to.be.empty;
        });

        it("should return an empty array if the given param is a boolean", () => {
            expect(filterAllFeatures(true)).to.be.empty;
        });

        it("should return an empty array if the given param is an array", () => {
            expect(filterAllFeatures([])).to.be.empty;
        });

        it("should call an error if the given param is not an array", () => {
            filterAllFeatures(true);
            expect(console.error.calledOnce).to.be.true;
        });

        it("should return an empty array if the second param is an object", () => {
            expect(filterAllFeatures([true], {})).to.be.empty;
        });

        it("should return an empty array if the second param is null", () => {
            expect(filterAllFeatures([true], null)).to.be.empty;
        });

        it("should return an empty array if the second param is undefined", () => {
            expect(filterAllFeatures([true], undefined)).to.be.empty;
        });

        it("should return an empty array if the second param is a number", () => {
            expect(filterAllFeatures([true], 666)).to.be.empty;
        });

        it("should return an empty array if the second param is a string", () => {
            expect(filterAllFeatures([true], "666")).to.be.empty;
        });

        it("should return an empty array if the second param is a boolean", () => {
            expect(filterAllFeatures([true], true)).to.be.empty;
        });

        it("should return an empty array if the second param is an array", () => {
            expect(filterAllFeatures([true], [])).to.be.empty;
        });

        it("should call an error if the second param is not a function", () => {
            filterAllFeatures([true], 666);
            expect(console.error.calledOnce).to.be.true;
        });

        it("should return an empty array if nothing was found", () => {
            const emptyArray = filterAllFeatures([true, true], (el) => el % 6 === 0);

            expect(emptyArray).to.deep.equal([]);
        });

        it("should return the expected values that match the given filter function.", () => {
            const values = filterAllFeatures([true, true], (el) => el % 2 === 0);

            expect(values).to.deep.equal([2, 4, 2, 4]);
        });
    });
});
