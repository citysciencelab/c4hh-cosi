import {expect} from "chai";
import {normalizeFeatureId, deepCloneCoords, findRemovedPoint} from "@modules/measure/js/measureUtils.js";

describe("src/modules/measure/js/measureUtils", function () {
    describe("normalizeFeatureId", function () {
        it("should convert a numeric string to a number", function () {
            expect(normalizeFeatureId("42")).to.equal(42);
        });
        it("should pass through a number", function () {
            expect(normalizeFeatureId(7)).to.equal(7);
        });
        it("should pass through null (non-string passthrough)", function () {
            expect(normalizeFeatureId(null)).to.be.null;
        });
        it("should pass through undefined (non-string passthrough)", function () {
            expect(normalizeFeatureId(undefined)).to.be.undefined;
        });
        it("should return NaN for a non-numeric string", function () {
            expect(normalizeFeatureId("abc")).to.be.NaN;
        });
    });

    describe("deepCloneCoords", function () {
        it("should deep-clone a flat coordinate array", function () {
            const coords = [[1, 2], [3, 4]];
            const clone = deepCloneCoords(coords);

            expect(clone).to.deep.equal(coords);
            expect(clone).not.to.equal(coords);
        });
        it("should deep-clone a nested coordinate array", function () {
            const coords = [[[1, 2], [3, 4]], [[5, 6]]];
            const clone = deepCloneCoords(coords);

            expect(clone).to.deep.equal(coords);
        });
        it("should return null for null input", function () {
            expect(deepCloneCoords(null)).to.be.null;
        });
        it("should return the original value for non-array input", function () {
            const input = "not-an-array";

            expect(deepCloneCoords(input)).to.equal(input);
        });
    });

    describe("findRemovedPoint", function () {
        it("should find the coordinate removed from the end", function () {
            const before = [[0, 0], [1, 1], [2, 2]],
                after = [[0, 0], [1, 1]];

            expect(findRemovedPoint(before, after)).to.deep.equal([2, 2]);
        });
        it("should find the coordinate removed from the middle", function () {
            const before = [[0, 0], [1, 1], [2, 2]],
                after = [[0, 0], [2, 2]];

            expect(findRemovedPoint(before, after)).to.deep.equal([1, 1]);
        });
        it("should find the coordinate removed from the start", function () {
            const before = [[0, 0], [1, 1], [2, 2]],
                after = [[1, 1], [2, 2]];

            expect(findRemovedPoint(before, after)).to.deep.equal([0, 0]);
        });
        it("should return null when arrays are the same length", function () {
            const coords = [[0, 0], [1, 1]];

            expect(findRemovedPoint(coords, coords)).to.be.null;
        });
        it("should return null for empty arrays", function () {
            expect(findRemovedPoint([], [])).to.be.null;
        });
    });
});
