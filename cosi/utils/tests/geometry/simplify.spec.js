import {expect} from "chai";
import sinon from "sinon";
import {Point, LineString} from "ol/geom";
import {simplify} from "../../geometry/simplify";

describe("addons/cosi/utils/geometry/simplify", () => {
    const point = new Point([2, 2]),
        lineString = new LineString([
            [2, 2],
            [78, 2],
            [2, 78],
            [2, 2]
        ]);

    beforeEach(function () {
        sinon.spy(console, "error");
    });

    afterEach(function () {
        console.error.restore();
        sinon.restore();
    });

    describe("simplify", () => {
        it("should return false if the given parameter is an object", () => {
            expect(simplify({})).to.be.false;
        });

        it("should return false if the given parameter is undefined", () => {
            expect(simplify(undefined)).to.be.false;
        });

        it("should return false if the given parameter is a boolean", () => {
            expect(simplify(true)).to.be.false;
        });

        it("should return false if the given parameter is a string", () => {
            expect(simplify("string")).to.be.false;
        });

        it("should return false if the given parameter is null", () => {
            expect(simplify(null)).to.be.false;
        });

        it("should return false if the given parameter is a number", () => {
            expect(simplify(666)).to.be.false;
        });

        it("should return false if the given parameter is an array", () => {
            expect(simplify([])).to.be.false;
        });

        it("should call an error if the given parameter is not an ol geometry", () => {
            simplify({});
            expect(console.error.calledOnce).to.be.true;
        });

        it("should return false if the second param is an object", () => {
            expect(simplify(point, {})).to.be.false;
        });

        it("should return false if the second param is null", () => {
            expect(simplify(point, null)).to.be.false;
        });

        it("should return false if the second param is a boolean", () => {
            expect(simplify(point, true)).to.be.false;
        });

        it("should return false if the second param is an array", () => {
            expect(simplify(point, [])).to.be.false;
        });

        it("should call an error if the second param is not a string", () => {
            simplify(point, true);
            expect(console.error.calledOnce).to.be.true;
        });

        it("should return the given point if the second param is undefined", () => {
            expect(simplify(point, undefined)).to.be.equal(point);
        });

        it("should return false if the given geometry is not supported", () => {
            expect(simplify(lineString)).to.be.false;
        });

        it("should call an error if the second param is not supported", () => {
            simplify(lineString);
            expect(console.error.calledOnce).to.be.true;
        });
    });
});
