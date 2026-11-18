import {expect} from "chai";
import Feature from "ol/Feature.js";
import {featureToGeoJson, featuresToGeoJsonCollection} from "@shared/js/utils/convertFeatureToGeoJSON.js";
import Point from "ol/geom/Point.js";
import sinon from "sinon";

describe("src/shared/js/utils/convertFeatureToGeoJSON.js", () => {
    beforeEach(() => {
        sinon.stub(console, "error").callsFake(sinon.spy());
    });

    describe("featureToGeoJson", () => {
        it("should return false if parameter feature is not an object", () => {
            expect(featureToGeoJson(null)).to.be.false;
            expect(featureToGeoJson(undefined)).to.be.false;
            expect(featureToGeoJson("not an object")).to.be.false;
            expect(featureToGeoJson(0)).to.be.false;
            expect(featureToGeoJson(false)).to.be.false;
            expect(featureToGeoJson([])).to.be.false;
        });

        it("should return false if parameter asString is a boolean value", () => {
            expect(featureToGeoJson({}, null)).to.be.false;
            expect(featureToGeoJson({}, undefined)).to.be.false;
            expect(featureToGeoJson({}, "not a boolean")).to.be.false;
            expect(featureToGeoJson({}, 0)).to.be.false;
            expect(featureToGeoJson({}, {})).to.be.false;
            expect(featureToGeoJson({}, [])).to.be.false;
        });

        it("should return false if parameter sourceCrs is not a string", () => {
            expect(featureToGeoJson({}, false, null)).to.be.false;
            expect(featureToGeoJson({}, false, undefined)).to.be.false;
            expect(featureToGeoJson({}, false, false)).to.be.false;
            expect(featureToGeoJson({}, false, 0)).to.be.false;
            expect(featureToGeoJson({}, false, {})).to.be.false;
            expect(featureToGeoJson({}, false, [])).to.be.false;
        });

        it("should return false if parameter targetCrs is not a string", () => {
            expect(featureToGeoJson({}, false, "EPSG:25832", null)).to.be.false;
            expect(featureToGeoJson({}, false, "EPSG:25832", undefined)).to.be.false;
            expect(featureToGeoJson({}, false, "EPSG:25832", false)).to.be.false;
            expect(featureToGeoJson({}, false, "EPSG:25832", 0)).to.be.false;
            expect(featureToGeoJson({}, false, "EPSG:25832", {})).to.be.false;
            expect(featureToGeoJson({}, false, "EPSG:25832", [])).to.be.false;
        });

        it("should return a geojson object", () => {
            const feature = new Feature({
                geometry: new Point([0, 0])
            });

            expect(featureToGeoJson(feature, false, "EPSG:25832", "EPSG:25832")).to.deep.equal({
                type: "Feature",
                geometry: {
                    type: "Point",
                    coordinates: [0, 0]
                },
                properties: null
            });
        });

        it("should return a geojson string", () => {
            const feature = new Feature({
                geometry: new Point([0, 0])
            });

            expect(featureToGeoJson(feature, true, "EPSG:25832", "EPSG:25832")).to.equal(JSON.stringify({
                type: "Feature",
                geometry: {
                    type: "Point",
                    coordinates: [0, 0]
                },
                properties: null
            }));
        });
    });

    describe("featuresToGeoJsonCollection", () => {
        it("should return false if parameter features is not an array", () => {
            expect(featuresToGeoJsonCollection(null)).to.be.false;
            expect(featuresToGeoJsonCollection(undefined)).to.be.false;
            expect(featuresToGeoJsonCollection("not an array")).to.be.false;
            expect(featuresToGeoJsonCollection(0)).to.be.false;
            expect(featuresToGeoJsonCollection(false)).to.be.false;
            expect(featuresToGeoJsonCollection({})).to.be.false;
        });

        it("should return false if parameter asString is a boolean value", () => {
            expect(featuresToGeoJsonCollection([], null)).to.be.false;
            expect(featuresToGeoJsonCollection([], "not a boolean")).to.be.false;
            expect(featuresToGeoJsonCollection([], 0)).to.be.false;
            expect(featuresToGeoJsonCollection([], {})).to.be.false;
            expect(featuresToGeoJsonCollection([], [])).to.be.false;
        });

        it("should return false if parameter sourceCrs is not a string", () => {
            expect(featuresToGeoJsonCollection([], false, null)).to.be.false;
            expect(featuresToGeoJsonCollection([], false, false)).to.be.false;
            expect(featuresToGeoJsonCollection([], false, 0)).to.be.false;
            expect(featuresToGeoJsonCollection([], false, {})).to.be.false;
            expect(featuresToGeoJsonCollection([], false, [])).to.be.false;
        });

        it("should return false if parameter targetCrs is not a string", () => {
            expect(featuresToGeoJsonCollection([], false, "EPSG:25832", null)).to.be.false;
            expect(featuresToGeoJsonCollection([], false, "EPSG:25832", false)).to.be.false;
            expect(featuresToGeoJsonCollection([], false, "EPSG:25832", 0)).to.be.false;
            expect(featuresToGeoJsonCollection([], false, "EPSG:25832", {})).to.be.false;
            expect(featuresToGeoJsonCollection([], false, "EPSG:25832", [])).to.be.false;
        });

        it("should return a geojson collection if all parameters are valid", () => {
            const feature = new Feature({
                geometry: new Point([0, 0])
            });

            expect(featuresToGeoJsonCollection([feature], false, "EPSG:25832", "EPSG:25832")).to.deep.equal({
                type: "FeatureCollection",
                features: [{
                    type: "Feature",
                    geometry: {
                        type: "Point",
                        coordinates: [0, 0]
                    },
                    properties: null
                }]
            });
        });

        it("should return a geojson collection string if all parameters are valid", () => {
            const feature = new Feature({
                geometry: new Point([0, 0])
            });

            expect(featuresToGeoJsonCollection([feature], true, "EPSG:25832", "EPSG:25832")).to.deep.equal(JSON.stringify({
                type: "FeatureCollection",
                features: [{
                    type: "Feature",
                    geometry: {
                        type: "Point",
                        coordinates: [0, 0]
                    },
                    properties: null
                }]
            }));
        });
    });
});
