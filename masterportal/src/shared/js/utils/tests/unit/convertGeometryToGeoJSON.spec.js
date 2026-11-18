import {expect} from "chai";
import {geometryToGeoJson} from "@shared/js/utils/convertGeometryToGeoJSON.js";
import Point from "ol/geom/Point.js";
import sinon from "sinon";

describe("src/shared/js/utils/convertGeometryToGeoJSON.js", () => {
    beforeEach(() => {
        sinon.stub(console, "error").callsFake(sinon.spy());
    });

    describe("geometryToGeoJson", () => {
        it("should return false if parameter geometry is not an object", () => {
            expect(geometryToGeoJson(null)).to.be.false;
            expect(geometryToGeoJson(undefined)).to.be.false;
            expect(geometryToGeoJson("not an object")).to.be.false;
            expect(geometryToGeoJson(0)).to.be.false;
            expect(geometryToGeoJson(false)).to.be.false;
            expect(geometryToGeoJson([])).to.be.false;
        });

        it("should return false if parameter asString is not a boolean value", () => {
            expect(geometryToGeoJson({}, null)).to.be.false;
            expect(geometryToGeoJson({}, "not a boolean")).to.be.false;
            expect(geometryToGeoJson({}, 0)).to.be.false;
            expect(geometryToGeoJson({}, {})).to.be.false;
            expect(geometryToGeoJson({}, [])).to.be.false;
        });

        it("should return false if parameter sourceCrs is not a string", () => {
            expect(geometryToGeoJson({}, false, null)).to.be.false;
            expect(geometryToGeoJson({}, false, false)).to.be.false;
            expect(geometryToGeoJson({}, false, 0)).to.be.false;
            expect(geometryToGeoJson({}, false, {})).to.be.false;
            expect(geometryToGeoJson({}, false, [])).to.be.false;
        });

        it("should return false if parameter targetCrs is not a string", () => {
            expect(geometryToGeoJson({}, false, "EPSG:25832", null)).to.be.false;
            expect(geometryToGeoJson({}, false, "EPSG:25832", false)).to.be.false;
            expect(geometryToGeoJson({}, false, "EPSG:25832", 0)).to.be.false;
            expect(geometryToGeoJson({}, false, "EPSG:25832", {})).to.be.false;
            expect(geometryToGeoJson({}, false, "EPSG:25832", [])).to.be.false;
        });

        it("should return a geojson object", () => {
            const geometry = new Point([0, 0]);

            expect(geometryToGeoJson(geometry, false, "EPSG:25832", "EPSG:25832")).to.deep.equal({
                type: "Point",
                coordinates: [0, 0]
            });
        });

        it("should return a geojson string", () => {
            const geometry = new Point([0, 0]);

            expect(geometryToGeoJson(geometry, true, "EPSG:25832", "EPSG:25832")).to.equal(JSON.stringify({
                type: "Point",
                coordinates: [0, 0]
            }));
        });
    });
});
