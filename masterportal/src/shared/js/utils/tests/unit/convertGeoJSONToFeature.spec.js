import {expect} from "chai";
import Feature from "ol/Feature.js";
import {geoJsonToFeature, geoJsonCollectionToFeatures} from "@shared/js/utils/convertGeoJSONToFeature.js";
import sinon from "sinon";

describe("src/shared/js/utils/convertGeoJSONToFeature.js", () => {
    beforeEach(() => {
        sinon.stub(console, "error").callsFake(sinon.spy());
    });

    describe("geoJsonToFeature", () => {
        it("should return false if parameter geojson is not an object", () => {
            expect(geoJsonToFeature(null)).to.be.false;
            expect(geoJsonToFeature(undefined)).to.be.false;
            expect(geoJsonToFeature("not an object")).to.be.false;
            expect(geoJsonToFeature(0)).to.be.false;
            expect(geoJsonToFeature(false)).to.be.false;
            expect(geoJsonToFeature([])).to.be.false;
        });

        it("should return false if parameter sourceCrs is not a string", () => {
            expect(geoJsonToFeature({}, false, null)).to.be.false;
            expect(geoJsonToFeature({}, false, undefined)).to.be.false;
            expect(geoJsonToFeature({}, false, false)).to.be.false;
            expect(geoJsonToFeature({}, false, 0)).to.be.false;
            expect(geoJsonToFeature({}, false, {})).to.be.false;
            expect(geoJsonToFeature({}, false, [])).to.be.false;
        });

        it("should return false if parameter targetCrs is not a string", () => {
            expect(geoJsonToFeature({}, false, "EPSG:25832", null)).to.be.false;
            expect(geoJsonToFeature({}, false, "EPSG:25832", undefined)).to.be.false;
            expect(geoJsonToFeature({}, false, "EPSG:25832", false)).to.be.false;
            expect(geoJsonToFeature({}, false, "EPSG:25832", 0)).to.be.false;
            expect(geoJsonToFeature({}, false, "EPSG:25832", {})).to.be.false;
            expect(geoJsonToFeature({}, false, "EPSG:25832", [])).to.be.false;
        });

        it("should return a feature", () => {
            const geoJson = {
                type: "Feature",
                geometry: {
                    type: "Point",
                    coordinates: [0, 0]
                },
                properties: null
            };

            expect(geoJsonToFeature(geoJson)).to.be.instanceOf(Feature);
        });
    });

    describe("geoJsonCollectionToFeatures", () => {
        it("should return false if parameter geojson is not an object", () => {
            expect(geoJsonCollectionToFeatures(null)).to.be.false;
            expect(geoJsonCollectionToFeatures(undefined)).to.be.false;
            expect(geoJsonCollectionToFeatures("not an object")).to.be.false;
            expect(geoJsonCollectionToFeatures(0)).to.be.false;
            expect(geoJsonCollectionToFeatures(false)).to.be.false;
            expect(geoJsonCollectionToFeatures([])).to.be.false;
        });

        it("should return false if parameter sourceCrs is not a string", () => {
            expect(geoJsonCollectionToFeatures({}, null)).to.be.false;
            expect(geoJsonCollectionToFeatures({}, false)).to.be.false;
            expect(geoJsonCollectionToFeatures({}, 0)).to.be.false;
            expect(geoJsonCollectionToFeatures({}, {})).to.be.false;
            expect(geoJsonCollectionToFeatures({}, [])).to.be.false;
        });

        it("should return false if parameter targetCrs is not a string", () => {
            expect(geoJsonCollectionToFeatures({}, "", null)).to.be.false;
            expect(geoJsonCollectionToFeatures({}, "", false)).to.be.false;
            expect(geoJsonCollectionToFeatures({}, "", 0)).to.be.false;
            expect(geoJsonCollectionToFeatures({}, "", {})).to.be.false;
            expect(geoJsonCollectionToFeatures({}, "", [])).to.be.false;
        });

        it("should return a feature", () => {
            const geoJson = {
                type: "Feature",
                geometry: {
                    type: "Point",
                    coordinates: [0, 0]
                },
                properties: null
            };

            expect(geoJsonCollectionToFeatures(geoJson)[0]).to.be.instanceOf(Feature);
        });
    });
});
