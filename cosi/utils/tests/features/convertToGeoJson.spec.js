import {expect} from "chai";
import {featureToGeoJson, featuresToGeoJsonCollection} from "../../features/convertToGeoJson";
import sinon from "sinon";
import Feature from "ol/Feature";
import {Point, Polygon} from "ol/geom";

describe("utils/features/convertToGeoJson", () => {
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
        });

    beforeEach(function () {
        sinon.spy(console, "error");
    });

    afterEach(function () {
        console.error.restore();
        sinon.restore();
    });

    describe("featureToGeoJson", () => {
        it("should return false if the given parameter is an object", () => {
            expect(featureToGeoJson({})).to.be.false;
        });

        it("should return false if the given parameter is undefined", () => {
            expect(featureToGeoJson(undefined)).to.be.false;
        });

        it("should return false if the given parameter is a boolean", () => {
            expect(featureToGeoJson(true)).to.be.false;
        });

        it("should return false if the given parameter is a string", () => {
            expect(featureToGeoJson("string")).to.be.false;
        });

        it("should return false if the given parameter is null", () => {
            expect(featureToGeoJson(null)).to.be.false;
        });

        it("should return false if the given parameter is a number", () => {
            expect(featureToGeoJson(666)).to.be.false;
        });

        it("should return false if the given parameter is an array", () => {
            expect(featureToGeoJson([])).to.be.false;
        });

        it("should return a GeoJSON feature if the given parameter an ol feature", () => {
            expect(featureToGeoJson(pointFeature)).to.be.an("object").that.has.all.keys("type", "geometry", "properties");
        });

        it("should call an error if the given parameter is not an ol feature", () => {
            featureToGeoJson({});
            expect(console.error.calledOnce).to.be.true;
        });

        it("should return false if the second passed parameter is an object", () => {
            expect(featureToGeoJson(pointFeature, {})).to.be.false;
        });

        it("should return false if the second passed parameter is an array", () => {
            expect(featureToGeoJson(pointFeature, [])).to.be.false;
        });

        it("should return false if the second passed parameter is a string", () => {
            expect(featureToGeoJson(pointFeature, "")).to.be.false;
        });

        it("should return false if the second passed parameter is a number", () => {
            expect(featureToGeoJson(pointFeature, 666)).to.be.false;
        });

        it("should return false if the second passed parameter is null", () => {
            expect(featureToGeoJson(pointFeature, null)).to.be.false;
        });

        it("should call an error if the second passend parameter is not a boolean or undefined", () => {
            featureToGeoJson({});
            expect(console.error.calledOnce).to.be.true;
        });

        it("should return a GeoJSON feature if the second passed parameter is undefined", () => {
            expect(featureToGeoJson(pointFeature, undefined)).to.be.an("object").that.has.all.keys("type", "geometry", "properties");
        });

        it("should return a GeoJSON Feature if the second passed parameter is false", () => {
            expect(featureToGeoJson(pointFeature, false)).to.be.an("object").that.has.all.keys("type", "geometry", "properties");
        });

        it("should return a GeoJSON Feature as string if the second passed parameter is true", () => {
            expect(featureToGeoJson(pointFeature, true)).to.be.a("string");
        });

        it("should return false if the third passed parameter is an object", () => {
            expect(featureToGeoJson(pointFeature, undefined, {})).to.be.false;
        });

        it("should return false if the third passed parameter is an array", () => {
            expect(featureToGeoJson(pointFeature, undefined, [])).to.be.false;
        });

        it("should return false if the third passed parameter is a number", () => {
            expect(featureToGeoJson(pointFeature, undefined, 666)).to.be.false;
        });

        it("should return false if the third passed parameter is a boolean", () => {
            expect(featureToGeoJson(pointFeature, undefined, true)).to.be.false;
        });

        it("should return false if the third passed parameter is null", () => {
            expect(featureToGeoJson(pointFeature, undefined, null)).to.be.false;
        });

        it("should call an error if the third passed parameter is not a boolean or undefined", () => {
            featureToGeoJson(pointFeature, undefined, 666);
            expect(console.error.calledOnce).to.be.true;
        });

        it("should return a GeoJSON Feature if the third passed parameter is undefined", () => {
            expect(featureToGeoJson(pointFeature, undefined, undefined)).to.be.an("object").that.has.all.keys("type", "geometry", "properties");
        });

        it("should return false if the fourth passed parameter is an object", () => {
            expect(featureToGeoJson(pointFeature, undefined, undefined, {})).to.be.false;
        });

        it("should return false if the fourth passed parameter is an array", () => {
            expect(featureToGeoJson(pointFeature, undefined, undefined, [])).to.be.false;
        });

        it("should return false if the fourth passed parameter is a number", () => {
            expect(featureToGeoJson(pointFeature, undefined, undefined, 666)).to.be.false;
        });

        it("should return false if the fourth passed parameter is a boolean", () => {
            expect(featureToGeoJson(pointFeature, undefined, undefined, true)).to.be.false;
        });

        it("should return false if the fourth passed parameter is null", () => {
            expect(featureToGeoJson(pointFeature, undefined, undefined, null)).to.be.false;
        });

        it("should call an error if the fourth passed parameter is not a boolean or undefined", () => {
            featureToGeoJson(pointFeature, undefined, undefined, 666);
            expect(console.error.calledOnce).to.be.true;
        });

        it("should return a GeoJSON Feature if the fourth passed parameter is undefined", () => {
            expect(featureToGeoJson(pointFeature, undefined, undefined, undefined)).to.be.an("object").that.has.all.keys("type", "geometry", "properties");
        });
    });

    describe("featuresToGeoJsonCollection", () => {
        it("should return false if the given parameter is an object", () => {
            expect(featuresToGeoJsonCollection({})).to.be.false;
        });

        it("should return false if the given parameter is undefined", () => {
            expect(featuresToGeoJsonCollection(undefined)).to.be.false;
        });

        it("should return false if the given parameter is a boolean", () => {
            expect(featuresToGeoJsonCollection(true)).to.be.false;
        });

        it("should return false if the given parameter is a string", () => {
            expect(featuresToGeoJsonCollection("string")).to.be.false;
        });

        it("should return false if the given parameter is null", () => {
            expect(featuresToGeoJsonCollection(null)).to.be.false;
        });

        it("should return false if the given parameter is a number", () => {
            expect(featuresToGeoJsonCollection(666)).to.be.false;
        });

        it("should return false if the given parameter is an empty array", () => {
            expect(featureToGeoJson([])).to.be.false;
        });

        it("should return a GeoJSON FeatureCollection if the given parameter is an array of ol features", () => {
            expect(featuresToGeoJsonCollection([pointFeature, polygonFeature])).to.be.an("object").that.has.all.keys("type", "features");
        });

        it("should call an error if the given parameter is not an array of ol features", () => {
            featuresToGeoJsonCollection({});
            expect(console.error.calledOnce).to.be.true;
        });

        it("should return false if the second passed parameter is an object", () => {
            expect(featuresToGeoJsonCollection([pointFeature], {})).to.be.false;
        });

        it("should return false if the second passed parameter is an array", () => {
            expect(featuresToGeoJsonCollection([pointFeature], [])).to.be.false;
        });

        it("should return false if the second passed parameter is a string", () => {
            expect(featuresToGeoJsonCollection([pointFeature], "")).to.be.false;
        });

        it("should return false if the second passed parameter is a number", () => {
            expect(featuresToGeoJsonCollection([pointFeature], 666)).to.be.false;
        });

        it("should return false if the second passed parameter is null", () => {
            expect(featuresToGeoJsonCollection([pointFeature], null)).to.be.false;
        });

        it("should call an error if the second passend parameter is not a boolean or undefined", () => {
            featuresToGeoJsonCollection({});
            expect(console.error.calledOnce).to.be.true;
        });

        it("should return a GeoJSON FeatureCollection if the second passed parameter is undefined", () => {
            expect(featuresToGeoJsonCollection([pointFeature], undefined)).to.be.an("object").that.has.all.keys("type", "features");
        });

        it("should return a GeoJSON FeatureCollection if the second passed parameter is false", () => {
            expect(featuresToGeoJsonCollection([pointFeature], false)).to.be.an("object").that.has.all.keys("type", "features");
        });

        it("should return a GeoJSON FeatureCollection as string if the second passed parameter is true", () => {
            expect(featuresToGeoJsonCollection([pointFeature], true)).to.be.a("string");
        });

        it("should return false if the third passed parameter is an object", () => {
            expect(featuresToGeoJsonCollection([pointFeature, polygonFeature], undefined, {})).to.be.false;
        });

        it("should return false if the third passed parameter is an array", () => {
            expect(featuresToGeoJsonCollection([pointFeature, polygonFeature], undefined, [])).to.be.false;
        });

        it("should return false if the third passed parameter is a number", () => {
            expect(featuresToGeoJsonCollection([pointFeature, polygonFeature], undefined, 666)).to.be.false;
        });

        it("should return false if the third passed parameter is a boolean", () => {
            expect(featuresToGeoJsonCollection([pointFeature, polygonFeature], undefined, true)).to.be.false;
        });

        it("should return false if the third passed parameter is null", () => {
            expect(featuresToGeoJsonCollection([pointFeature, polygonFeature], undefined, null)).to.be.false;
        });

        it("should call an error if the third passed parameter is not a boolean or undefined", () => {
            featuresToGeoJsonCollection([pointFeature, polygonFeature], undefined, 666);
            expect(console.error.calledOnce).to.be.true;
        });

        it("should return a GeoJSON Feature if the third passed parameter is undefined", () => {
            expect(featuresToGeoJsonCollection([pointFeature, polygonFeature], undefined, undefined)).to.be.an("object").that.has.all.keys("type", "features");
        });

        it("should return false if the fourth passed parameter is an object", () => {
            expect(featuresToGeoJsonCollection([pointFeature, polygonFeature], undefined, undefined, {})).to.be.false;
        });

        it("should return false if the fourth passed parameter is an array", () => {
            expect(featuresToGeoJsonCollection([pointFeature, polygonFeature], undefined, undefined, [])).to.be.false;
        });

        it("should return false if the fourth passed parameter is a number", () => {
            expect(featuresToGeoJsonCollection([pointFeature, polygonFeature], undefined, undefined, 666)).to.be.false;
        });

        it("should return false if the fourth passed parameter is a boolean", () => {
            expect(featuresToGeoJsonCollection([pointFeature, polygonFeature], undefined, undefined, true)).to.be.false;
        });

        it("should return false if the fourth passed parameter is null", () => {
            expect(featuresToGeoJsonCollection([pointFeature, polygonFeature], undefined, undefined, null)).to.be.false;
        });

        it("should call an error if the fourth [pointFeature, polygonFeature] parameter is not a boolean or undefined", () => {
            featuresToGeoJsonCollection(pointFeature, undefined, undefined, 666);
            expect(console.error.calledOnce).to.be.true;
        });

        it("should return a GeoJSON Feature if the fourth passed parameter is undefined", () => {
            expect(featuresToGeoJsonCollection([pointFeature, polygonFeature], undefined, undefined, undefined)).to.be.an("object").that.has.all.keys("type", "features");
        });
    });
});
