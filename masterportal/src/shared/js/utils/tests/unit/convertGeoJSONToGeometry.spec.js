import {expect} from "chai";
import {geoJsonToGeometry} from "@shared/js/utils/convertGeoJSONToGeometry.js";
import Point from "ol/geom/Point.js";
import sinon from "sinon";

describe("src/shared/js/utils/convertGeoJSONToGeometry.js", () => {
    beforeEach(() => {
        sinon.stub(console, "error").callsFake(sinon.spy());
    });

    describe("geoJsonToGeometry", () => {
        it("should return false if parameter geojson is not an object", () => {
            expect(geoJsonToGeometry(null)).to.be.false;
            expect(geoJsonToGeometry(undefined)).to.be.false;
            expect(geoJsonToGeometry("not an object")).to.be.false;
            expect(geoJsonToGeometry(0)).to.be.false;
            expect(geoJsonToGeometry(false)).to.be.false;
            expect(geoJsonToGeometry([])).to.be.false;
        });

        it("should return false if parameter sourceCrs is not a string", () => {
            expect(geoJsonToGeometry({}, null)).to.be.false;
            expect(geoJsonToGeometry({}, false)).to.be.false;
            expect(geoJsonToGeometry({}, 0)).to.be.false;
            expect(geoJsonToGeometry({}, {})).to.be.false;
            expect(geoJsonToGeometry({}, [])).to.be.false;
        });

        it("should return false if parameter targetCrs is not a string", () => {
            expect(geoJsonToGeometry({}, "", null)).to.be.false;
            expect(geoJsonToGeometry({}, "", false)).to.be.false;
            expect(geoJsonToGeometry({}, "", 0)).to.be.false;
            expect(geoJsonToGeometry({}, "", {})).to.be.false;
            expect(geoJsonToGeometry({}, "", [])).to.be.false;
        });

        it("should return a geometry", () => {
            const geoJson = {
                type: "Point",
                coordinates: [0, 0]
            };

            expect(geoJsonToGeometry(geoJson)).to.be.instanceOf(Point);
        });
    });
});
