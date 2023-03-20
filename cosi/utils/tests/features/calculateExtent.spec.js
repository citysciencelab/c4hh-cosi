import {expect} from "chai";
import calculateExtent from "../../features/calculateExtent";
import sinon from "sinon";
import Feature from "ol/Feature";
import {LineString, Point, Polygon} from "ol/geom";

describe("utils/features/calculateExtent", () => {
    const pointFeature = new Feature({
            geometry: new Point([88, 88])
        }),
        polygonFeature = new Feature({
            geometry: new Polygon([
                [
                    [2, 2],
                    [78, 2],
                    [2, 78],
                    [2, 2]
                ]
            ])
        }),
        lineStringFeature = new Feature({
            geometry: new LineString([
                [10, 10],
                [90, 90]
            ])
        }),
        noGeometryFeature = new Feature();

    beforeEach(function () {
        sinon.spy(console, "error");
    });

    afterEach(function () {
        console.error.restore();
        sinon.restore();
    });

    it("should return false if the given parameter is an object", () => {
        expect(calculateExtent({})).to.be.false;
    });

    it("should return false if the given parameter is undefined", () => {
        expect(calculateExtent(undefined)).to.be.false;
    });

    it("should return false if the given parameter is a boolean", () => {
        expect(calculateExtent(true)).to.be.false;
    });

    it("should return false if the given parameter is a string", () => {
        expect(calculateExtent("string")).to.be.false;
    });

    it("should return false if the given parameter is null", () => {
        expect(calculateExtent(null)).to.be.false;
    });

    it("should return false if the given parameter is a number", () => {
        expect(calculateExtent(666)).to.be.false;
    });

    it("should call an error if the given parameter is not an array", () => {
        calculateExtent(666);
        expect(console.error.calledOnce).to.be.true;
    });

    it("should return false if the second passed parameter is an object", () => {
        expect(calculateExtent([], {})).to.be.false;
    });

    it("should return false if the second passed parameter is undefined", () => {
        expect(calculateExtent([], undefined)).to.be.false;
    });

    it("should return false if the second passed parameter is a boolean", () => {
        expect(calculateExtent([], true)).to.be.false;
    });

    it("should return false if the second passed parameter is a string", () => {
        expect(calculateExtent([], "string")).to.be.false;
    });

    it("should return false if the second passed parameter is null", () => {
        expect(calculateExtent([], null)).to.be.false;
    });

    it("should return false if the second passed parameter is an array", () => {
        expect(calculateExtent([], [])).to.be.false;
    });

    it("should call an error if the second passed parameter is not a number", () => {
        calculateExtent([], "666");
        expect(console.error.calledOnce).to.be.true;
    });

    it("should return false if the second parameter is right but no feature passed", () => {
        expect(calculateExtent([], 10)).to.be.false;
    });

    it("should return false if the features has no geometry", () => {
        expect(calculateExtent([noGeometryFeature])).to.be.false;
    });

    it("should return the correct extent for one feature", () => {
        expect(calculateExtent([pointFeature])).to.deep.equal([88, 88, 88, 88]);
    });

    it("should return the correct extent for several features", () => {
        expect(calculateExtent([pointFeature, polygonFeature, lineStringFeature])).to.deep.equal([2, 2, 90, 90]);
    });

    it("should return the correct extent even if a feature has no geometry", () => {
        expect(calculateExtent([noGeometryFeature, pointFeature, lineStringFeature])).to.deep.equal([10, 10, 90, 90]);
    });

    it("should return the correct extent if a buffer is given", () => {
        expect(calculateExtent([pointFeature, polygonFeature], 10)).to.deep.equal([-8, -8, 98, 98]);
    });

    it("should return the correct extent if a negative buffer is given", () => {
        expect(calculateExtent([pointFeature, polygonFeature], -10)).to.deep.equal([12, 12, 78, 78]);
    });
});
