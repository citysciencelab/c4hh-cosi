import {expect} from "chai";
import sinon from "sinon";
import {Polygon, Point, MultiPolygon, LineString} from "ol/geom";
import {getFlatCoordinates} from "../../geometry/getFlatCoordinates";

describe("addons/cosi/utils/geometry/getFlatCoordinates", () => {
    const point = new Point([2, 2]),
        lineString = new LineString([
            [2, 2],
            [78, 2],
            [2, 78],
            [2, 2]
        ]),
        polygon = new Polygon([
            [
                [2, 2],
                [78, 2],
                [2, 78],
                [2, 2]
            ]
        ]),
        multiPolygon = new MultiPolygon([
            [
                [
                    [2, 2],
                    [78, 2],
                    [2, 78],
                    [2, 2]
                ]
            ],
            [
                [
                    [2, 2],
                    [78, 2],
                    [2, 78],
                    [2, 2]
                ]
            ]
        ]);

    beforeEach(function () {
        sinon.spy(console, "error");
    });

    afterEach(function () {
        console.error.restore();
        sinon.restore();
    });

    describe("getFlatCoordinates", () => {
        it("should return false if the given parameter is an object", () => {
            expect(getFlatCoordinates({})).to.be.false;
        });

        it("should return false if the given parameter is undefined", () => {
            expect(getFlatCoordinates(undefined)).to.be.false;
        });

        it("should return false if the given parameter is a boolean", () => {
            expect(getFlatCoordinates(true)).to.be.false;
        });

        it("should return false if the given parameter is a string", () => {
            expect(getFlatCoordinates("string")).to.be.false;
        });

        it("should return false if the given parameter is null", () => {
            expect(getFlatCoordinates(null)).to.be.false;
        });

        it("should return false if the given parameter is a number", () => {
            expect(getFlatCoordinates(666)).to.be.false;
        });

        it("should return false if the given parameter is an array", () => {
            expect(getFlatCoordinates([])).to.be.false;
        });

        it("should call an error if the given parameter is not an ol geometry", () => {
            getFlatCoordinates({});
            expect(console.error.calledOnce).to.be.true;
        });

        it("should return the coordinate of a point in an array", () => {
            expect(getFlatCoordinates(point)).to.deep.equal([point.getCoordinates()]);
        });

        it("should return an array with all coordinates of the given polygon", () => {
            expect(getFlatCoordinates(polygon)).to.deep.equal([
                [2, 2],
                [78, 2],
                [2, 78],
                [2, 2]
            ]);
        });

        it("should return an array with all coordinates of the given multi polygon", () => {
            expect(getFlatCoordinates(multiPolygon)).to.deep.equal([
                [2, 2],
                [78, 2],
                [2, 78],
                [2, 2],
                [2, 2],
                [78, 2],
                [2, 78],
                [2, 2]
            ]);
        });

        it("should return false if the given geometry type is not supported", () => {
            expect(getFlatCoordinates(lineString)).to.be.false;
        });

        it("should call an error if the given geometry type is not supported ", () => {
            getFlatCoordinates(lineString);
            expect(console.error.calledOnce).to.be.true;
        });
    });
});
